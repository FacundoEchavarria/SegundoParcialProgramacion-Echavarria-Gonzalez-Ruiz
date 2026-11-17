import "server-only";
import { and, count, desc, eq, gt, ne, or, sql } from "drizzle-orm";
import { db, transaccionEscritura } from "@/db";
import { clientes, movimientosCuenta } from "@/db/schema";
import { ApiError, validar } from "@/lib/api-error";
import { altaClienteSchema, edicionClienteSchema, listadoClientesSchema, normalizarDocumento } from "@/lib/schemas/clientes";
import { usuarioIdSchema } from "@/lib/schemas/usuarios";
import type { UsuarioSesion } from "@/services/auth";
import { calcularSaldo, sumaCuenta } from "@/services/cuenta-corriente";

const camposCliente = {
  id: clientes.id,
  tipoDoc: clientes.tipoDoc,
  nroDoc: clientes.nroDoc,
  nombre: clientes.nombre,
  domicilio: clientes.domicilio,
  telefono: clientes.telefono,
  email: clientes.email,
  cuentaCorriente: clientes.cuentaCorriente,
  limiteCredito: clientes.limiteCredito,
  activo: clientes.activo,
};

type FilaCliente = Pick<typeof clientes.$inferSelect, keyof typeof camposCliente>;

function normalizarNombre(nombre: string) {
  return nombre.normalize("NFC").toLocaleLowerCase("es-AR");
}

function clientePublico(cliente: FilaCliente, saldo: number) {
  const disponible = cliente.limiteCredito === null
    ? null
    : Math.max(0, cliente.limiteCredito - saldo);
  return { ...cliente, saldo, disponible };
}

function clienteInexistente() {
  return new ApiError(404, "NO_ENCONTRADO", "El cliente no existe.");
}

function documentoDuplicado() {
  return new ApiError(409, "DOCUMENTO_DUPLICADO", "Ya existe un cliente con ese documento.");
}

// RF-C1 y RF-C6. La suma agrupada permite filtrar y ordenar por saldo antes de paginar.
export async function listarClientes(_actor: UsuarioSesion, input: unknown) {
  const { q, conDeuda, orden, page, pageSize } = validar(listadoClientesSchema, input);
  const saldos = db.select({
    clienteId: movimientosCuenta.clienteId,
    total: sumaCuenta.as("saldo"),
  }).from(movimientosCuenta).groupBy(movimientosCuenta.clienteId).as("saldos");
  const saldo = sql<number>`coalesce(${saldos.total}, 0)`.mapWith(Number);
  const buscarNombre = `%${normalizarNombre(q).replace(/[!%_]/g, "!$&")}%`;
  const documento = normalizarDocumento(q);
  const filtro = and(
    q ? or(
      sql`${clientes.nombreBusqueda} like ${buscarNombre} escape '!'`,
      /^\d+$/.test(documento) ? sql`${clientes.nroDoc} like ${`%${documento}%`}` : undefined,
    ) : undefined,
    conDeuda === "true" ? gt(saldo, 0) : undefined,
  );
  const porSaldo = (orden ?? (conDeuda === "true" ? "saldo" : "nombre")) === "saldo";
  const relacion = eq(clientes.id, saldos.clienteId);
  const [filas, [resumen]] = await Promise.all([
    db.select({ ...camposCliente, saldo }).from(clientes).leftJoin(saldos, relacion)
      .where(filtro).orderBy(...(porSaldo ? [desc(saldo)] : []), clientes.nombre, clientes.id)
      .limit(pageSize).offset((page - 1) * pageSize),
    db.select({
      total: count(),
      ...(conDeuda === "true" ? { totalAdeudado: sql<number>`coalesce(sum(${saldo}), 0)`.mapWith(Number) } : {}),
    }).from(clientes).leftJoin(saldos, relacion).where(filtro),
  ]);
  return {
    data: filas.map(({ saldo, ...cliente }) => clientePublico(cliente, saldo)),
    page,
    pageSize,
    ...resumen,
  };
}

// RF-C3. Las facturas se incorporan cuando se implemente facturación.
export async function obtenerCliente(_actor: UsuarioSesion, inputId: unknown) {
  const id = validar(usuarioIdSchema, inputId);
  const [cliente] = await db.select(camposCliente).from(clientes).where(eq(clientes.id, id));
  if (!cliente) throw clienteInexistente();
  const saldo = await calcularSaldo(db, id);
  return { ...clientePublico(cliente, saldo), ultimasFacturas: [] };
}

// RF-C2. El documento normalizado se compara también en la restricción única de la base.
export async function crearCliente(_actor: UsuarioSesion, input: unknown) {
  const datos = validar(altaClienteSchema, input);
  const [nuevo] = await transaccionEscritura((tx) => tx.insert(clientes)
    .values({ ...datos, nombreBusqueda: normalizarNombre(datos.nombre) })
    .onConflictDoNothing({ target: [clientes.tipoDoc, clientes.nroDoc] }).returning(camposCliente));
  if (!nuevo) throw documentoDuplicado();
  return clientePublico(nuevo, 0);
}

// RF-C2 y RF-C7. Consultar la deuda y cambiar el estado son una sola operación.
export async function editarCliente(_actor: UsuarioSesion, inputId: unknown, input: unknown) {
  const id = validar(usuarioIdSchema, inputId);
  const datos = validar(edicionClienteSchema, input);
  return transaccionEscritura(async (tx) => {
    const [cliente] = await tx.select(camposCliente).from(clientes).where(eq(clientes.id, id));
    if (!cliente) throw clienteInexistente();
    const saldo = await calcularSaldo(tx, id);
    if (saldo !== 0 && (datos.activo === false || datos.cuentaCorriente === false)) {
      throw new ApiError(422, "SALDO_PENDIENTE", "El cliente tiene saldo pendiente.");
    }
    if (datos.tipoDoc !== undefined || datos.nroDoc !== undefined) {
      const [otro] = await tx.select({ id: clientes.id }).from(clientes).where(and(
        eq(clientes.tipoDoc, datos.tipoDoc ?? cliente.tipoDoc),
        eq(clientes.nroDoc, datos.nroDoc ?? cliente.nroDoc),
        ne(clientes.id, id),
      ));
      if (otro) throw documentoDuplicado();
    }
    const [actualizado] = await tx.update(clientes).set({
      ...datos,
      nombreBusqueda: datos.nombre === undefined ? undefined : normalizarNombre(datos.nombre),
    })
      .where(eq(clientes.id, id)).returning(camposCliente);
    return clientePublico(actualizado, saldo);
  });
}
