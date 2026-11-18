"use server";

import { normalizarError } from "@/lib/api-error";
import { borrarCookieSesion, escribirCookieSesion, requireApiSession } from "@/lib/auth-request";
import { cambiarPassword, cerrarSesion, iniciarSesion } from "@/services/auth";
import { crearUsuario, editarUsuario, restablecerPassword } from "@/services/usuarios";
import { crearCategoria, crearProducto, editarCategoria, editarProducto } from "@/services/productos";
import { registrarMovimiento } from "@/services/stock";
import { crearCliente, editarCliente } from "@/services/clientes";
import { registrarPago } from "@/services/pagos";

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

export async function crearCategoriaAction(input: unknown) {
  return ejecutar(async () => crearCategoria((await requireApiSession()).usuario, input));
}

export async function editarCategoriaAction(id: number, input: unknown) {
  return ejecutar(async () => editarCategoria((await requireApiSession()).usuario, id, input));
}

export async function crearProductoAction(input: unknown) {
  return ejecutar(async () => crearProducto((await requireApiSession()).usuario, input));
}

export async function editarProductoAction(id: number, input: unknown) {
  return ejecutar(async () => editarProducto((await requireApiSession()).usuario, id, input));
}

export async function registrarMovimientoAction(id: number, input: unknown) {
  return ejecutar(async () => registrarMovimiento((await requireApiSession()).usuario, id, input));
}

export async function crearClienteAction(input: unknown) {
  return ejecutar(async () => crearCliente((await requireApiSession()).usuario, input));
}

export async function editarClienteAction(id: number, input: unknown) {
  return ejecutar(async () => editarCliente((await requireApiSession()).usuario, id, input));
}

export async function registrarPagoAction(clienteId: number, input: unknown) {
  return ejecutar(async () => registrarPago((await requireApiSession()).usuario, clienteId, input));
}
