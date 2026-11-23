import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
  facturaId: integer("factura_id").references(() => facturas.id),
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

export const clientes = sqliteTable("clientes", {
  id: integer().primaryKey(),
  tipoDoc: text("tipo_doc", { enum: ["DNI", "CUIT"] }).notNull(),
  nroDoc: text("nro_doc").notNull(),
  nombre: text().notNull(),
  nombreBusqueda: text("nombre_busqueda").notNull(),
  domicilio: text(),
  telefono: text(),
  email: text(),
  cuentaCorriente: integer("cuenta_corriente", { mode: "boolean" }).notNull().default(false),
  limiteCredito: integer("limite_credito"),
  activo: integer({ mode: "boolean" }).notNull().default(true),
  creadoEn: integer("creado_en", { mode: "timestamp" })
    .notNull().default(sql`(unixepoch())`),
}, (tabla) => [
  uniqueIndex("clientes_documento_unique").on(tabla.tipoDoc, tabla.nroDoc),
  check("clientes_tipo_doc_valido", sql`${tabla.tipoDoc} in ('DNI', 'CUIT')`),
  check("clientes_limite_valido", sql`${tabla.limiteCredito} >= 0`),
]);

export const facturas = sqliteTable("facturas", {
  id: integer().primaryKey(),
  puntoVenta: integer("punto_venta").notNull(),
  numero: integer().notNull(),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull(),
  estado: text({ enum: ["emitida", "anulada"] }).notNull().default("emitida"),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  usuarioNombre: text("usuario_nombre").notNull(),
  clienteId: integer("cliente_id").references(() => clientes.id),
  clienteNombre: text("cliente_nombre"),
  clienteTipoDoc: text("cliente_tipo_doc", { enum: ["DNI", "CUIT"] }),
  clienteNroDoc: text("cliente_nro_doc"),
  clienteDomicilio: text("cliente_domicilio"),
  total: integer().notNull(),
  formaPago: text("forma_pago", { enum: ["contado", "tarjeta", "cuenta_corriente"] }).notNull(),
  montoRecibido: integer("monto_recibido"),
  tarjetaTipo: text("tarjeta_tipo", { enum: ["debito", "credito"] }),
  tarjetaMarca: text("tarjeta_marca"),
  tarjetaUltimos4: text("tarjeta_ultimos4"),
  saldoCliente: integer("saldo_cliente"),
  anuladaEn: integer("anulada_en", { mode: "timestamp" }),
  anuladaPorId: integer("anulada_por_id").references(() => usuarios.id),
  anuladaPorNombre: text("anulada_por_nombre"),
  motivoAnulacion: text("motivo_anulacion"),
  importeDevueltoAnulacion: integer("importe_devuelto_anulacion"),
}, (tabla) => [
  uniqueIndex("facturas_punto_venta_numero_unique").on(tabla.puntoVenta, tabla.numero),
  index("facturas_cliente_fecha_idx").on(tabla.clienteId, tabla.creadoEn),
  check("facturas_importes_validos", sql`
    ${tabla.total} > 0 and (${tabla.montoRecibido} is null or ${tabla.montoRecibido} >= ${tabla.total})
  `),
  check("facturas_estado_valido", sql`${tabla.estado} in ('emitida', 'anulada')`),
  check("facturas_forma_pago_valida", sql`${tabla.formaPago} in ('contado', 'tarjeta', 'cuenta_corriente')`),
]);

export const facturaItems = sqliteTable("factura_items", {
  id: integer().primaryKey(),
  facturaId: integer("factura_id").notNull().references(() => facturas.id),
  productoId: integer("producto_id").notNull().references(() => productos.id),
  codigo: text().notNull(),
  descripcion: text().notNull(),
  cantidad: integer().notNull(),
  precioUnitario: integer("precio_unitario").notNull(),
  subtotal: integer().notNull(),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull(),
}, (tabla) => [
  uniqueIndex("factura_items_producto_unique").on(tabla.facturaId, tabla.productoId),
  check("factura_items_importes_validos", sql`
    ${tabla.cantidad} > 0 and ${tabla.precioUnitario} > 0
    and ${tabla.subtotal} = ${tabla.cantidad} * ${tabla.precioUnitario}
  `),
]);

export const pagos = sqliteTable("pagos", {
  id: integer().primaryKey({ autoIncrement: true }),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  clienteNombre: text("cliente_nombre").notNull(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  usuarioNombre: text("usuario_nombre").notNull(),
  importe: integer().notNull(),
  medio: text({ enum: ["efectivo", "transferencia", "tarjeta_debito"] }).notNull(),
  observacion: text(),
  saldoCliente: integer("saldo_cliente").notNull(),
  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull(),
}, (tabla) => [
  check("pagos_importe_valido", sql`${tabla.importe} > 0`),
  check("pagos_saldo_valido", sql`${tabla.saldoCliente} >= 0`),
  check("pagos_medio_valido", sql`${tabla.medio} in ('efectivo', 'transferencia', 'tarjeta_debito')`),
]);

export const movimientosCuenta = sqliteTable("movimientos_cuenta", {
  id: integer().primaryKey(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  tipo: text({ enum: ["debito", "credito"] }).notNull(),
  importe: integer().notNull(),
  descripcion: text().notNull(),
  pagoId: integer("pago_id").references(() => pagos.id).unique(),
  facturaId: integer("factura_id").references(() => facturas.id),
  creadoEn: integer("creado_en", { mode: "timestamp" })
    .notNull().default(sql`(unixepoch())`),
}, (tabla) => [
  index("movimientos_cuenta_cliente_fecha_idx").on(tabla.clienteId, tabla.creadoEn),
  check("movimientos_cuenta_tipo_valido", sql`${tabla.tipo} in ('debito', 'credito')`),
  check("movimientos_cuenta_importe_valido", sql`${tabla.importe} > 0`),
]);
