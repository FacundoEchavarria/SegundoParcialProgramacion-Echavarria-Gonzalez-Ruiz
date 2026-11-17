import { z } from "zod";

const email = z.string().trim().toLowerCase().max(254).pipe(
  z.email({ error: "Ingresá un email válido." }),
);
const passwordIngresada = z.string()
  .min(1, "Ingresá la contraseña.")
  .refine(
    (valor) => new TextEncoder().encode(valor).length <= 72,
    "La contraseña debe ocupar como máximo 72 bytes.",
  );
const passwordNueva = passwordIngresada.refine(
  (valor) => Array.from(valor).length >= 8,
  "Usá al menos 8 caracteres.",
);
const datosUsuario = {
  nombre: z.string().trim().min(1, "Ingresá el nombre.").max(100),
  email,
  rol: z.enum(["admin", "vendedor"]),
};

export const loginSchema = z.strictObject({ email, password: passwordIngresada });
export const cambioPasswordSchema = z.strictObject({
  actual: passwordIngresada,
  nueva: passwordNueva,
});
export const altaUsuarioSchema = z.strictObject({
  ...datosUsuario,
  password: passwordNueva,
});
export const edicionUsuarioSchema = z.strictObject({
  ...datosUsuario,
  activo: z.boolean(),
}).partial().refine(
  (datos) => Object.values(datos).some((valor) => valor !== undefined),
  "Indicá al menos un campo para editar.",
);

const enteroPositivo = z.union([z.number(), z.string().regex(/^\d+$/)])
  .transform(Number)
  .pipe(z.number().int().min(1));

export const usuarioIdSchema = enteroPositivo;
export const listadoUsuariosSchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  activo: z.enum(["true", "false"]).optional(),
  page: enteroPositivo.default(1),
  pageSize: enteroPositivo.refine((valor) => valor <= 100).default(20),
}).refine(
  ({ page, pageSize }) => Number.isSafeInteger((page - 1) * pageSize),
  { path: ["page"], message: "La página está fuera de rango." },
);
