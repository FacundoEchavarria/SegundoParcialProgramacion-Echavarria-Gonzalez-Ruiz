import { z } from "zod";
import { usuarioIdSchema as id } from "./usuarios";

function conCambios(datos: object) {
  return Object.values(datos).some((valor) => valor !== undefined);
}

const nombre = z.string().trim().min(1, "Ingresá el nombre.").max(100);
export const altaCategoriaSchema = z.strictObject({ nombre });
export const edicionCategoriaSchema = z.strictObject({
  nombre, activa: z.boolean(),
}).partial().refine(conCambios, "Indicá al menos un campo para editar.");

const camposProducto = {
  codigo: z.string().trim().toUpperCase().min(1, "Ingresá el código.").max(50),
  descripcion: z.string().trim().min(1, "Ingresá la descripción.").max(250),
  categoriaId: z.number().int().positive(),
  precio: z.number().int().positive(),
  stockMinimo: z.number().int().nonnegative(),
};

export const altaProductoSchema = z.strictObject({
  ...camposProducto, stockInicial: z.number().int().nonnegative().optional(),
});
export const edicionProductoSchema = z.strictObject({
  ...camposProducto, activo: z.boolean(),
}).partial().refine(conCambios, "Indicá al menos un campo para editar.");

const paginacion = {
  page: id.default(1),
  pageSize: id.refine((valor) => valor <= 100).default(20),
};

function paginaValida({ page, pageSize }: { page: number; pageSize: number }) {
  return Number.isSafeInteger((page - 1) * pageSize);
}

const errorPagina = { path: ["page"], message: "La página está fuera de rango." };
export const listadoProductosSchema = z.strictObject({
  ...paginacion,
  q: z.string().trim().max(100).default(""),
  categoriaId: id.optional(),
  bajoMinimo: z.enum(["true", "false"]).optional(),
  activo: z.enum(["true", "false", "todos"]).default("true"),
}).refine(paginaValida, errorPagina);

export const motivosPorTipo = {
  ingreso: ["Reposición", "Stock inicial", "Devolución de cliente"],
  egreso: ["Rotura", "Vencimiento", "Ajuste de inventario", "Uso interno"],
};

export const movimientoManualSchema = z.strictObject({
  tipo: z.enum(["ingreso", "egreso"]),
  cantidad: z.number().int().positive(),
  motivo: z.string().trim(),
  observacion: z.string().trim().max(500).optional(),
}).refine(
  (datos) => motivosPorTipo[datos.tipo].includes(datos.motivo),
  { path: ["motivo"], message: "Elegí un motivo válido para el tipo de movimiento." },
);

export const listadoMovimientosSchema = z.strictObject({
  ...paginacion,
  productoId: id.optional(),
  tipo: z.enum(["ingreso", "egreso", "venta", "anulacion"]).optional(),
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
}).refine(paginaValida, errorPagina).refine(
  ({ desde, hasta }) => !desde || !hasta || desde <= hasta,
  { path: ["hasta"], message: "La fecha final debe ser igual o posterior a la inicial." },
);
