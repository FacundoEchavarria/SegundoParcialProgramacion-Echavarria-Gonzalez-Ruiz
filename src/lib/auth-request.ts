import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-error";
import { firmarSesion, leerSesionFirmada, SESSION_COOKIE } from "@/lib/session-token";
import { resolverUsuario, SESSION_SECONDS } from "@/services/auth";

export const getRequestSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const id = await leerSesionFirmada(token);
  if (!id) return null;
  const usuario = await resolverUsuario(id);
  return usuario ? { id, usuario } : null;
});

export async function requirePageUser() {
  const sesion = await getRequestSession();
  if (!sesion) redirect("/login");
  return sesion.usuario;
}

export async function requireApiSession() {
  const sesion = await getRequestSession();
  if (!sesion) {
    throw new ApiError(401, "NO_AUTENTICADO", "Iniciá sesión para continuar.");
  }
  return sesion;
}

const opcionesCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

export async function escribirCookieSesion(id: string, venceEn: Date) {
  const valor = await firmarSesion(id, venceEn);
  (await cookies()).set(SESSION_COOKIE, valor, { ...opcionesCookie, maxAge: SESSION_SECONDS });
}

export async function borrarCookieSesion() {
  (await cookies()).set(SESSION_COOKIE, "", { ...opcionesCookie, maxAge: 0 });
}
