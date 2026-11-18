import "server-only";
import { eq } from "drizzle-orm";
import { db, transaccionEscritura } from "@/db";
import { clientes, movimientosCuenta, pagos } from "@/db/schema";
import { ApiError, validar } from "@/lib/api-error";
import { pagoSchema } from "@/lib/schemas/pagos";
import { usuarioIdSchema } from "@/lib/schemas/usuarios";
import type { UsuarioSesion } from "@/services/auth";
import { calcularSaldo } from "@/services/cuenta-corriente";

function numeroRecibo(id: number) {
  return `R 0001-${String(id).padStart(8, "0")}`;
}

function armarRecibo(pago: typeof pagos.$inferSelect) {
  return {
    id: pago.id,
    numeroRecibo: numeroRecibo(pago.id),
    fecha: pago.creadoEn.toISOString(),
    cliente: { id: pago.clienteId, nombre: pago.clienteNombre },
    importe: pago.importe,
    medio: pago.medio,
    usuario: { id: pago.usuarioId, nombre: pago.usuarioNombre },
    saldoCliente: pago.saldoCliente,
  };
}

// RF-C5. El ID de pagos es la secuencia propia del recibo y se asigna junto con el crédito.
export async function registrarPago(actor: UsuarioSesion, inputId: unknown, input: unknown) {
  const clienteId = validar(usuarioIdSchema, inputId);
  const { importe, medio, observacion } = validar(pagoSchema, input);

  return transaccionEscritura(async (tx) => {
    const [cliente] = await tx.select().from(clientes).where(eq(clientes.id, clienteId));
    if (!cliente) throw new ApiError(404, "NO_ENCONTRADO", "El cliente no existe.");
    if (!cliente.activo || !cliente.cuentaCorriente) {
      throw new ApiError(422, "CUENTA_CORRIENTE_NO_HABILITADA", "La cuenta corriente no está habilitada.");
    }

    const saldo = await calcularSaldo(tx, clienteId);
    if (importe > saldo) {
      throw new ApiError(422, "PAGO_SUPERA_DEUDA", "El pago supera la deuda actual.");
    }

    const creadoEn = new Date();
    const [pago] = await tx.insert(pagos).values({
      clienteId,
      clienteNombre: cliente.nombre,
      usuarioId: actor.id,
      usuarioNombre: actor.nombre,
      importe,
      medio,
      observacion: observacion || null,
      saldoCliente: saldo - importe,
      creadoEn,
    }).returning();
    await tx.insert(movimientosCuenta).values({
      clienteId, tipo: "credito", importe, descripcion: `Recibo ${numeroRecibo(pago.id)}`,
      pagoId: pago.id, creadoEn,
    });
    return armarRecibo(pago);
  });
}

export async function obtenerPago(_actor: UsuarioSesion, inputId: unknown) {
  const id = validar(usuarioIdSchema, inputId);
  const [pago] = await db.select().from(pagos).where(eq(pagos.id, id));
  if (!pago) throw new ApiError(404, "NO_ENCONTRADO", "El recibo no existe.");

  return { recibo: armarRecibo(pago), observacion: pago.observacion };
}
