"use server";

import { normalizarError } from "@/lib/api-error";
import { borrarCookieSesion, escribirCookieSesion, requireApiSession } from "@/lib/auth-request";
import { cambiarPassword, cerrarSesion, iniciarSesion } from "@/services/auth";
import { crearUsuario, editarUsuario, restablecerPassword } from "@/services/usuarios";

async function ejecutar<T>(operacion: () => Promise<T>) {
  try {
    return { ok: true as const, data: await operacion() };
  } catch (error) {
    return { ok: false as const, error: normalizarError(error).toJSON() };
  }
}

export async function loginAction(input: unknown) {
  return ejecutar(async () => {
    const { id, usuario, venceEn } = await iniciarSesion(input);
    await escribirCookieSesion(id, venceEn);
    return usuario;
  });
}

export async function logoutAction() {
  return ejecutar(async () => {
    const { id } = await requireApiSession();
    await cerrarSesion(id);
    await borrarCookieSesion();
    return null;
  });
}

export async function cambiarPasswordAction(input: unknown) {
  return ejecutar(async () => {
    const { usuario } = await requireApiSession();
    await cambiarPassword(usuario, input);
    await borrarCookieSesion();
    return null;
  });
}

export async function crearUsuarioAction(input: unknown) {
  return ejecutar(async () => {
    const { usuario } = await requireApiSession();
    return crearUsuario(usuario, input);
  });
}

export async function editarUsuarioAction(id: number, input: unknown) {
  return ejecutar(async () => {
    const { usuario } = await requireApiSession();
    return editarUsuario(usuario, id, input);
  });
}

export async function restablecerPasswordAction(id: number) {
  return ejecutar(async () => {
    const { usuario } = await requireApiSession();
    return restablecerPassword(usuario, id);
  });
}
