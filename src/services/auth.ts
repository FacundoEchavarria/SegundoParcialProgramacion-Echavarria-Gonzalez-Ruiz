import "server-only";
import { randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { and, eq, gt, lte } from "drizzle-orm";
import { db } from "@/db";
import { sesiones, usuarios } from "@/db/schema";
import { ApiError, validar } from "@/lib/api-error";
import { cambioPasswordSchema, loginSchema } from "@/lib/schemas/usuarios";

export const camposSesion = {
  id: usuarios.id,
  nombre: usuarios.nombre,
  email: usuarios.email,
  rol: usuarios.rol,
};

export type UsuarioSesion = Pick<typeof usuarios.$inferSelect, keyof typeof camposSesion>;
export const SESSION_SECONDS = 8 * 60 * 60;
const hashDeRelleno = "$2b$12$r7v.GcFVPksNVqnYxMb1Euk01HoMKuZjPaVMZSI1gsFALqzKXZM3e";

export function calcularHash(password: string) {
  return hash(password, 12);
}

function credencialesInvalidas() {
  return new ApiError(401, "CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos.");
}

// RF-U1. La comparación también se hace cuando el email no existe.
export async function iniciarSesion(input: unknown) {
  const { email, password } = validar(loginSchema, input);
  const [cuenta] = await db.select().from(usuarios).where(eq(usuarios.email, email));
  const coincide = await compare(password, cuenta?.passwordHash ?? hashDeRelleno);
  if (!cuenta?.activo || !coincide) throw credencialesInvalidas();

  const id = randomBytes(32).toString("base64url");
  const ahora = new Date();
  const venceEn = new Date((Math.floor(ahora.getTime() / 1000) + SESSION_SECONDS) * 1000);

  const usuario = await db.transaction(async (tx) => {
    // Un cambio de contraseña durante la comparación invalida el intento.
    const [vigente] = await tx.select(camposSesion).from(usuarios).where(and(
      eq(usuarios.id, cuenta.id),
      eq(usuarios.activo, true),
      eq(usuarios.passwordHash, cuenta.passwordHash),
    ));
    if (!vigente) throw credencialesInvalidas();

    await tx.delete(sesiones).where(lte(sesiones.venceEn, ahora));
    await tx.insert(sesiones).values({ id, usuarioId: vigente.id, venceEn });
    return vigente;
  });

  return { id, usuario, venceEn };
}

// RF-U2. El rol y el estado se leen de la base, incluso con una cookie válida.
export async function resolverUsuario(id: string) {
  const [usuario] = await db.select(camposSesion)
    .from(sesiones)
    .innerJoin(usuarios, eq(sesiones.usuarioId, usuarios.id))
    .where(and(
      eq(sesiones.id, id),
      gt(sesiones.venceEn, new Date()),
      eq(usuarios.activo, true),
    ));
  return usuario ?? null;
}

// RF-U1. La cookie anterior deja de funcionar aunque alguien conserve una copia.
export async function cerrarSesion(id: string) {
  await db.delete(sesiones).where(eq(sesiones.id, id));
}

// RF-U5.
export async function cambiarPassword(usuario: UsuarioSesion, input: unknown) {
  const { actual, nueva } = validar(cambioPasswordSchema, input);
  const [cuenta] = await db.select({ passwordHash: usuarios.passwordHash })
    .from(usuarios).where(and(eq(usuarios.id, usuario.id), eq(usuarios.activo, true)));
  if (!cuenta || !(await compare(actual, cuenta.passwordHash))) {
    throw new ApiError(422, "CONTRASENA_ACTUAL_INCORRECTA", "La contraseña actual es incorrecta.");
  }
  const passwordHash = await calcularHash(nueva);

  await db.transaction(async (tx) => {
    const [actualizado] = await tx.update(usuarios).set({ passwordHash }).where(and(
      eq(usuarios.id, usuario.id),
      eq(usuarios.activo, true),
      eq(usuarios.passwordHash, cuenta.passwordHash),
    )).returning({ id: usuarios.id });
    if (!actualizado) {
      throw new ApiError(422, "CONTRASENA_ACTUAL_INCORRECTA", "La contraseña actual es incorrecta.");
    }
    await tx.delete(sesiones).where(eq(sesiones.usuarioId, usuario.id));
  });
}
