import { z } from "zod";

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
