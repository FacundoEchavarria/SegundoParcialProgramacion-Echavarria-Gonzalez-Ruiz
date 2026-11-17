import { z } from "zod";
import { usuarioIdSchema as id } from "./usuarios";

export function normalizarDocumento(documento: string) {
  return documento.replace(/[.\s-]/g, "");
}

const camposCliente = {
  tipoDoc: z.enum(["DNI", "CUIT"]),
  nroDoc: z.string().trim().max(32).transform(normalizarDocumento)
    .pipe(z.string().regex(/^\d+$/, "Ingresá un número de documento válido.")),
  nombre: z.string().trim().min(1, "Ingresá el nombre o razón social.").max(150),
  domicilio: z.string().trim().max(200).nullable().optional(),
  telefono: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().toLowerCase().max(254)
    .pipe(z.email({ error: "Ingresá un email válido." })).nullable().optional(),
  cuentaCorriente: z.boolean().optional(),
  limiteCredito: z.number().int().nonnegative().nullable().optional(),
};

export const altaClienteSchema = z.strictObject(camposCliente);
export const edicionClienteSchema = z.strictObject({ ...camposCliente, activo: z.boolean() })
  .partial().refine(
    (datos) => Object.values(datos).some((valor) => valor !== undefined),
    "Indicá al menos un campo para editar.",
  );

export const listadoClientesSchema = z.strictObject({
  q: z.string().trim().max(150).default(""),
  conDeuda: z.enum(["true", "false"]).optional(),
  orden: z.enum(["saldo", "nombre"]).optional(),
  page: id.default(1),
  pageSize: id.refine((valor) => valor <= 100).default(20),
}).refine(
  ({ page, pageSize }) => Number.isSafeInteger((page - 1) * pageSize),
  { path: ["page"], message: "La página está fuera de rango." },
);

export const consultaCuentaSchema = z.strictObject({
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
}).refine(
  ({ desde, hasta }) => !desde || !hasta || desde <= hasta,
  { path: ["hasta"], message: "La fecha final debe ser igual o posterior a la inicial." },
);
