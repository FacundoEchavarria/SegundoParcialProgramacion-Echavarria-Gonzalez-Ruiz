import { z } from "zod";

const medioPago = z.enum(["efectivo", "transferencia", "tarjeta_debito"]);

export const mediosPago = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Tarjeta de débito",
} satisfies Record<z.infer<typeof medioPago>, string>;

export const pagoSchema = z.strictObject({
  importe: z.number().int().positive("Ingresá un importe mayor a cero."),
  medio: medioPago,
  observacion: z.string().trim().optional(),
});
