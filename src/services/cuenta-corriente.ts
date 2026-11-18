import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { clientes, movimientosCuenta } from "@/db/schema";
import { ApiError, validar } from "@/lib/api-error";
import { consultaCuentaSchema } from "@/lib/schemas/clientes";
import { usuarioIdSchema } from "@/lib/schemas/usuarios";
import type { UsuarioSesion } from "@/services/auth";

// RF-C4. Un débito aumenta el saldo adeudado y un crédito lo reduce.
const importeConSigno = sql<number>`case
  when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe}
  else -${movimientosCuenta.importe}
end`;

export const sumaCuenta = sql<number>`coalesce(sum(${importeConSigno}), 0)`.mapWith(Number);

export async function calcularSaldo(conexion: Pick<typeof db, "select">, clienteId: number) {
  const [fila] = await conexion.select({ saldo: sumaCuenta }).from(movimientosCuenta)
    .where(eq(movimientosCuenta.clienteId, clienteId));
  return fila.saldo;
}

function inicioDiaArgentino(fecha: string) {
  return new Date(`${fecha}T00:00:00-03:00`);
}

// RF-C4. Recorremos los movimientos hasta el cierre para incluir el saldo anterior.
export async function obtenerCuenta(_actor: UsuarioSesion, inputId: unknown, input: unknown) {
  const clienteId = validar(usuarioIdSchema, inputId);
  const { desde, hasta } = validar(consultaCuentaSchema, input);
  const [cliente] = await db.select({ id: clientes.id, nombre: clientes.nombre }).from(clientes)
    .where(eq(clientes.id, clienteId));
  if (!cliente) throw new ApiError(404, "NO_ENCONTRADO", "El cliente no existe.");

  const inicio = desde ? inicioDiaArgentino(desde) : undefined;
  const finExclusivo = hasta
    ? new Date(inicioDiaArgentino(hasta).getTime() + 24 * 60 * 60 * 1000)
    : undefined;
  const filas = await db.select({
    fecha: movimientosCuenta.creadoEn,
    tipo: movimientosCuenta.tipo,
    importe: movimientosCuenta.importe,
    descripcion: movimientosCuenta.descripcion,
    pagoId: movimientosCuenta.pagoId,
    facturaId: movimientosCuenta.facturaId,
    cambio: importeConSigno,
  }).from(movimientosCuenta).where(and(
    eq(movimientosCuenta.clienteId, clienteId),
    finExclusivo ? lt(movimientosCuenta.creadoEn, finExclusivo) : undefined,
  )).orderBy(movimientosCuenta.creadoEn, movimientosCuenta.id);

  let saldo = 0;
  let saldoAnterior = 0;
  const movimientos = [];
  for (const { fecha, cambio, ...datos } of filas) {
    saldo += cambio;
    if (inicio && fecha < inicio) {
      saldoAnterior = saldo;
    } else {
      movimientos.push({ fecha: fecha.toISOString(), ...datos, saldo });
    }
  }
  return { cliente, saldoAnterior, movimientos, saldo };
}
