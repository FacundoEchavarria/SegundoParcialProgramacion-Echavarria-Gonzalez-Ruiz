import "server-only";
import { and, eq } from "drizzle-orm";
import type { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { camposSesion, type UsuarioSesion } from "@/services/auth";

export function exigirAdmin(usuario: UsuarioSesion | undefined) {
  if (usuario?.rol !== "admin") {
    throw new ApiError(403, "SIN_PERMISO", "Esta operación es solo para administradores.");
  }
}

// Revisa el rol dentro de la transacción que va a escribir.
export async function exigirAdminVigente(tx: Pick<typeof db, "select">, actor: UsuarioSesion) {
  const [vigente] = await tx.select(camposSesion).from(usuarios).where(and(
    eq(usuarios.id, actor.id),
    eq(usuarios.activo, true),
  ));
  exigirAdmin(vigente);
}
