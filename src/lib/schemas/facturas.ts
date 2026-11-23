import { z } from "zod";
import { usuarioIdSchema as id } from "./usuarios";

const item = z.strictObject({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().positive(),
});

const pago = z.discriminatedUnion("forma", [
  z.strictObject({
    forma: z.literal("contado"),
    montoRecibido: z.number().int().nonnegative().optional(),
  }),
  z.strictObject({
    forma: z.literal("tarjeta"),
    tarjeta: z.strictObject({
      tipo: z.enum(["debito", "credito"]),
      marca: z.string().trim().min(1).max(40).refine(
        (marca) => marca.replace(/\D/g, "").length < 12,
        "Ingresá solo la marca de la tarjeta.",
      ),
      ultimos4: z.string().regex(/^\d{4}$/, "Ingresá exactamente cuatro dígitos."),
    }),
  }),
  z.strictObject({ forma: z.literal("cuenta_corriente") }),
]);

export const ventaSchema = z.strictObject({
  clienteId: z.number().int().positive().nullable(),
  items: z.array(item).min(1, "Agregá un producto.").refine(
    (items) => new Set(items.map(({ productoId }) => productoId)).size === items.length,
    "Los productos de la venta no se pueden repetir.",
  ),
  pago,
});

export const listadoFacturasSchema = z.strictObject({
  q: z.string().trim().max(150).default(""),
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
  clienteId: id.optional(),
  vendedorId: id.optional(),
  forma: z.enum(["contado", "tarjeta", "cuenta_corriente"]).optional(),
  estado: z.enum(["emitida", "anulada"]).optional(),
  page: id.default(1),
  pageSize: id.refine((valor) => valor <= 100).default(20),
}).refine(
  ({ desde, hasta }) => !desde || !hasta || desde <= hasta,
  { path: ["hasta"], message: "La fecha final debe ser igual o posterior a la inicial." },
).refine(
  ({ page, pageSize }) => Number.isSafeInteger((page - 1) * pageSize),
  { path: ["page"], message: "La página está fuera de rango." },
);

export const anulacionSchema = z.strictObject({
  motivo: z.string().trim().min(1, "Ingresá el motivo de anulación.").max(500),
  importeDevuelto: z.number().int().nonnegative().optional(),
});
