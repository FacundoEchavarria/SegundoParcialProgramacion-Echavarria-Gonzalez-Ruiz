import "server-only";
import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db, transaccionEscritura, type Transaccion } from "@/db";
import { movimientosStock, productos, usuarios } from "@/db/schema";
import { ApiError, validar } from "@/lib/api-error";
import { listadoMovimientosSchema, movimientoManualSchema } from "@/lib/schemas/productos";
import { usuarioIdSchema } from "@/lib/schemas/usuarios";
import type { UsuarioSesion } from "@/services/auth";
import { exigirAdmin, exigirAdminVigente } from "@/services/permisos";

const camposMovimiento = {
  id: movimientosStock.id,
  tipo: movimientosStock.tipo,
  cantidad: movimientosStock.cantidad,
  existenciaResultante: movimientosStock.existenciaResultante,
  motivo: movimientosStock.motivo,
  observacion: movimientosStock.observacion,
  fecha: movimientosStock.creadoEn,
  producto: { id: productos.id, codigo: productos.codigo },
  usuario: { id: usuarios.id, nombre: usuarios.nombre },
};

function consultaMovimientos(conexion: Pick<typeof db, "select">) {
  return conexion.select(camposMovimiento).from(movimientosStock)
    .innerJoin(productos, eq(productos.id, movimientosStock.productoId))
    .innerJoin(usuarios, eq(usuarios.id, movimientosStock.usuarioId));
}

type FilaMovimiento = Awaited<ReturnType<typeof consultaMovimientos>>[number];

function movimientoPublico(fila: FilaMovimiento) {
  return { ...fila, fecha: fila.fecha.toISOString(), referencia: null };
}

// RF-P4 y RF-P5. Todo cambio de existencia y su registro comparten transacción.
export async function moverStock(tx: Transaccion, datos: {
  productoId: number;
  usuarioId: number;
  tipo: typeof movimientosStock.$inferInsert.tipo;
  cantidad: number;
  motivo: string;
  observacion?: string;
}) {
  const { productoId, tipo } = datos;
  const cantidad = tipo === "egreso" || tipo === "venta" ? -datos.cantidad : datos.cantidad;
  const siguiente = sql`${productos.existencia} + ${cantidad}`;
  const [producto] = await tx.update(productos).set({ existencia: siguiente }).where(and(
    eq(productos.id, productoId),
    sql`${siguiente} between 0 and ${Number.MAX_SAFE_INTEGER}`,
  )).returning({ existencia: productos.existencia });

  if (!producto) {
    const [actual] = await tx.select({ id: productos.id }).from(productos)
      .where(eq(productos.id, productoId));
    if (!actual) throw new ApiError(404, "NO_ENCONTRADO", "El producto no existe.");
    if (cantidad < 0) {
      throw new ApiError(409, "STOCK_INSUFICIENTE", "El producto no tiene stock suficiente.");
    }
    throw new ApiError(422, "VALIDACION", "La existencia resultante supera el máximo permitido.");
  }

  const [movimiento] = await tx.insert(movimientosStock)
    .values({ ...datos, cantidad, existenciaResultante: producto.existencia })
    .returning({ id: movimientosStock.id });
  return movimiento.id;
}

// RF-P4 y RF-P5.
export async function registrarMovimiento(actor: UsuarioSesion, inputId: unknown, input: unknown) {
  exigirAdmin(actor);
  const productoId = validar(usuarioIdSchema, inputId);
  const datos = validar(movimientoManualSchema, input);
  return transaccionEscritura(async (tx) => {
    await exigirAdminVigente(tx, actor);
    const id = await moverStock(tx, { ...datos, productoId, usuarioId: actor.id });
    const [fila] = await consultaMovimientos(tx).where(eq(movimientosStock.id, id));
    return movimientoPublico(fila);
  });
}

function inicioDiaArgentino(fecha: string) {
  return new Date(`${fecha}T00:00:00-03:00`);
}

// RF-P6. Si la ruta es de un producto, verificamos que su ficha exista.
export async function listarMovimientos(
  _actor: UsuarioSesion,
  input: unknown,
  inputId?: unknown,
) {
  const datos = validar(listadoMovimientosSchema, input);
  let productoId = datos.productoId;
  if (inputId !== undefined) {
    productoId = validar(usuarioIdSchema, inputId);
    const [producto] = await db.select({ id: productos.id }).from(productos)
      .where(eq(productos.id, productoId));
    if (!producto) throw new ApiError(404, "NO_ENCONTRADO", "El producto no existe.");
  }
  const { tipo, desde, hasta, page, pageSize } = datos;
  const finExclusivo = hasta
    ? new Date(inicioDiaArgentino(hasta).getTime() + 24 * 60 * 60 * 1000)
    : undefined;
  const filtro = and(
    productoId ? eq(movimientosStock.productoId, productoId) : undefined,
    tipo ? eq(movimientosStock.tipo, tipo) : undefined,
    desde ? gte(movimientosStock.creadoEn, inicioDiaArgentino(desde)) : undefined,
    finExclusivo ? lt(movimientosStock.creadoEn, finExclusivo) : undefined,
  );
  const [filas, [resumen]] = await Promise.all([
    consultaMovimientos(db).where(filtro).orderBy(
      desc(movimientosStock.creadoEn), desc(movimientosStock.id),
    ).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(movimientosStock).where(filtro),
  ]);
  return { data: filas.map(movimientoPublico), page, pageSize, total: resumen.total };
}
