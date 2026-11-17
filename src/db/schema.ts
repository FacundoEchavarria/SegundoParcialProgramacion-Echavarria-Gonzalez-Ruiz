import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usuarios = sqliteTable(
  "usuarios",
  {
    id: integer().primaryKey(),
    nombre: text().notNull(),
    email: text().notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    rol: text({ enum: ["admin", "vendedor"] }).notNull(),
    activo: integer({ mode: "boolean" }).notNull().default(true),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (tabla) => [
    check("usuarios_rol_valido", sql`${tabla.rol} in ('admin', 'vendedor')`),
  ],
);

export const sesiones = sqliteTable(
  "sesiones",
  {
    id: text().primaryKey(),
    usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    venceEn: integer("vence_en", { mode: "timestamp" }).notNull(),
  },
  (tabla) => [
    index("sesiones_usuario_idx").on(tabla.usuarioId),
    index("sesiones_vencimiento_idx").on(tabla.venceEn),
  ],
);

export const categorias = sqliteTable("categorias", {
  id: integer().primaryKey(),
  nombre: text().notNull().unique(),
  activa: integer({ mode: "boolean" }).notNull().default(true),
  creadoEn: integer("creado_en", { mode: "timestamp" })
    .notNull().default(sql`(unixepoch())`),
});

export const productos = sqliteTable("productos", {
  id: integer().primaryKey(),
  codigo: text().notNull().unique(),
  descripcion: text().notNull(),
  categoriaId: integer("categoria_id").notNull().references(() => categorias.id),
  precio: integer().notNull(),
  existencia: integer().notNull().default(0),
  stockMinimo: integer("stock_minimo").notNull(),
  activo: integer({ mode: "boolean" }).notNull().default(true),
  creadoEn: integer("creado_en", { mode: "timestamp" })
    .notNull().default(sql`(unixepoch())`),
}, (tabla) => [
  index("productos_categoria_idx").on(tabla.categoriaId),
  check("productos_importes_validos", sql`${tabla.precio} > 0 and ${tabla.stockMinimo} >= 0`),
  check("productos_existencia_valida", sql`${tabla.existencia} >= 0`),
]);

export const movimientosStock = sqliteTable("movimientos_stock", {
  id: integer().primaryKey(),
  productoId: integer("producto_id").notNull().references(() => productos.id),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  tipo: text({ enum: ["ingreso", "egreso", "venta", "anulacion"] }).notNull(),
  cantidad: integer().notNull(),
  existenciaResultante: integer("existencia_resultante").notNull(),
  motivo: text().notNull(),
  observacion: text(),
  creadoEn: integer("creado_en", { mode: "timestamp" })
    .notNull().default(sql`(unixepoch())`),
}, (tabla) => [
  index("movimientos_stock_producto_fecha_idx").on(tabla.productoId, tabla.creadoEn),
  index("movimientos_stock_fecha_idx").on(tabla.creadoEn),
  check("movimientos_stock_cantidad_valida", sql`
    (${tabla.tipo} in ('ingreso', 'anulacion') and ${tabla.cantidad} > 0)
    or (${tabla.tipo} in ('egreso', 'venta') and ${tabla.cantidad} < 0)
  `),
]);
