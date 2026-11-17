import "server-only";
import { and, count, eq, lt, ne, or, sql } from "drizzle-orm";
import { db, transaccionEscritura, type Transaccion } from "@/db";
import { categorias, productos } from "@/db/schema";
import { ApiError, validar } from "@/lib/api-error";
import {
  altaCategoriaSchema, altaProductoSchema, edicionCategoriaSchema,
  edicionProductoSchema, listadoProductosSchema,
} from "@/lib/schemas/productos";
import { usuarioIdSchema } from "@/lib/schemas/usuarios";
import type { UsuarioSesion } from "@/services/auth";
import { exigirAdmin, exigirAdminVigente } from "@/services/permisos";
import { moverStock } from "@/services/stock";

const camposCategoria = { id: categorias.id, nombre: categorias.nombre, activa: categorias.activa };
const camposProducto = {
  id: productos.id,
  codigo: productos.codigo,
  descripcion: productos.descripcion,
  precio: productos.precio,
  existencia: productos.existencia,
  stockMinimo: productos.stockMinimo,
  activo: productos.activo,
  categoria: { id: categorias.id, nombre: categorias.nombre },
};

function consultaProductos(conexion: Pick<typeof db, "select">) {
  return conexion.select(camposProducto).from(productos)
    .innerJoin(categorias, eq(categorias.id, productos.categoriaId));
}

type FilaProducto = Awaited<ReturnType<typeof consultaProductos>>[number];

function productoPublico(fila: FilaProducto) {
  return { ...fila, bajoMinimo: fila.existencia < fila.stockMinimo };
}

function sinProducto() {
  return new ApiError(404, "NO_ENCONTRADO", "El producto no existe.");
}

function codigoDuplicado() {
  return new ApiError(409, "CODIGO_DUPLICADO", "Ya existe un producto con ese código.");
}

function nombreDuplicado() {
  return new ApiError(409, "NOMBRE_DUPLICADO", "Ya existe una categoría con ese nombre.");
}

async function exigirCategoriaActiva(tx: Transaccion, id: number) {
  const [categoria] = await tx.select(camposCategoria).from(categorias).where(eq(categorias.id, id));
  if (!categoria) throw new ApiError(404, "NO_ENCONTRADO", "La categoría no existe.");
  if (!categoria.activa) {
    throw new ApiError(422, "VALIDACION", "Elegí una categoría activa.");
  }
}

// RF-P1.
export async function listarProductos(actor: UsuarioSesion, input: unknown) {
  const { q, categoriaId, bajoMinimo, activo, page, pageSize } = validar(listadoProductosSchema, input);
  if (activo !== "true") exigirAdmin(actor);

  const buscar = `%${q.replace(/[!%_]/g, "!$&")}%`;
  const filtro = and(
    activo === "todos" ? undefined : eq(productos.activo, activo === "true"),
    categoriaId ? eq(productos.categoriaId, categoriaId) : undefined,
    bajoMinimo === "true" ? lt(productos.existencia, productos.stockMinimo) : undefined,
    q ? or(
      sql`${productos.codigo} like ${buscar} escape '!'`,
      sql`${productos.descripcion} like ${buscar} escape '!'`,
    ) : undefined,
  );
  const [filas, [resumen]] = await Promise.all([
    consultaProductos(db).where(filtro).orderBy(productos.codigo)
      .limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(productos).where(filtro),
  ]);
  return { data: filas.map(productoPublico), page, pageSize, total: resumen.total };
}

// RF-P1.
export async function obtenerProducto(_actor: UsuarioSesion, inputId: unknown) {
  const id = validar(usuarioIdSchema, inputId);
  const [fila] = await consultaProductos(db).where(eq(productos.id, id));
  if (!fila) throw sinProducto();
  return productoPublico(fila);
}

// RF-P2. El stock inicial se registra como ingreso dentro del alta.
export async function crearProducto(actor: UsuarioSesion, input: unknown) {
  exigirAdmin(actor);
  const { stockInicial, ...datos } = validar(altaProductoSchema, input);
  return transaccionEscritura(async (tx) => {
    await exigirAdminVigente(tx, actor);
    await exigirCategoriaActiva(tx, datos.categoriaId);
    const [nuevo] = await tx.insert(productos).values(datos)
      .onConflictDoNothing({ target: productos.codigo }).returning({ id: productos.id });
    if (!nuevo) throw codigoDuplicado();
    if (stockInicial) {
      await moverStock(tx, {
        productoId: nuevo.id, usuarioId: actor.id, tipo: "ingreso",
        cantidad: stockInicial, motivo: "Stock inicial",
      });
    }
    const [fila] = await consultaProductos(tx).where(eq(productos.id, nuevo.id));
    return productoPublico(fila);
  });
}

// RF-P2 y RF-P3.
export async function editarProducto(actor: UsuarioSesion, inputId: unknown, input: unknown) {
  exigirAdmin(actor);
  const id = validar(usuarioIdSchema, inputId);
  const datos = validar(edicionProductoSchema, input);
  return transaccionEscritura(async (tx) => {
    await exigirAdminVigente(tx, actor);
    const [actual] = await tx.select().from(productos).where(eq(productos.id, id));
    if (!actual) throw sinProducto();
    if (datos.categoriaId !== undefined || datos.activo === true) {
      await exigirCategoriaActiva(tx, datos.categoriaId ?? actual.categoriaId);
    }
    if (datos.codigo) {
      const [otro] = await tx.select({ id: productos.id }).from(productos)
        .where(and(eq(productos.codigo, datos.codigo), ne(productos.id, id)));
      if (otro) throw codigoDuplicado();
    }
    await tx.update(productos).set(datos).where(eq(productos.id, id));
    const [fila] = await consultaProductos(tx).where(eq(productos.id, id));
    return productoPublico(fila);
  });
}

// RF-P7.
export function listarCategorias(actor: UsuarioSesion, incluirInactivas = false) {
  if (incluirInactivas) exigirAdmin(actor);
  return db.select(camposCategoria).from(categorias)
    .where(incluirInactivas ? undefined : eq(categorias.activa, true))
    .orderBy(categorias.nombre);
}

// RF-P7.
export async function crearCategoria(actor: UsuarioSesion, input: unknown) {
  exigirAdmin(actor);
  const datos = validar(altaCategoriaSchema, input);
  return transaccionEscritura(async (tx) => {
    await exigirAdminVigente(tx, actor);
    const [nueva] = await tx.insert(categorias).values(datos)
      .onConflictDoNothing({ target: categorias.nombre }).returning(camposCategoria);
    if (!nueva) throw nombreDuplicado();
    return nueva;
  });
}

// RF-P7.
export async function editarCategoria(actor: UsuarioSesion, inputId: unknown, input: unknown) {
  exigirAdmin(actor);
  const id = validar(usuarioIdSchema, inputId);
  const datos = validar(edicionCategoriaSchema, input);
  return transaccionEscritura(async (tx) => {
    await exigirAdminVigente(tx, actor);
    const [actual] = await tx.select(camposCategoria).from(categorias).where(eq(categorias.id, id));
    if (!actual) throw new ApiError(404, "NO_ENCONTRADO", "La categoría no existe.");
    if (datos.nombre) {
      const [otra] = await tx.select({ id: categorias.id }).from(categorias)
        .where(and(eq(categorias.nombre, datos.nombre), ne(categorias.id, id)));
      if (otra) throw nombreDuplicado();
    }
    if (datos.activa === false) {
      const [enUso] = await tx.select({ id: productos.id }).from(productos)
        .where(and(eq(productos.categoriaId, id), eq(productos.activo, true))).limit(1);
      if (enUso) {
        throw new ApiError(409, "CATEGORIA_EN_USO", "La categoría tiene productos activos.");
      }
    }
    const [actualizada] = await tx.update(categorias).set(datos)
      .where(eq(categorias.id, id)).returning(camposCategoria);
    return actualizada;
  });
}
