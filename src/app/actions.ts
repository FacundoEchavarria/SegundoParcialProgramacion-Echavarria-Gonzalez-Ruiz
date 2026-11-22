"use server";

import { ApiError, normalizarError } from "@/lib/api-error";
import { credencialesDemo, rolesDemo, type RolDemo } from "@/lib/demo";
import { borrarCookieSesion, escribirCookieSesion, requireApiSession } from "@/lib/auth-request";
import { cambiarPassword, cerrarSesion, iniciarSesion } from "@/services/auth";
import { crearUsuario, editarUsuario, restablecerPassword } from "@/services/usuarios";
import { crearCategoria, crearProducto, editarCategoria, editarProducto } from "@/services/productos";
import { registrarMovimiento } from "@/services/stock";
import { crearCliente, editarCliente } from "@/services/clientes";
import { registrarPago } from "@/services/pagos";
import { anularFactura } from "@/services/facturas";

async function ejecutar<T>(operacion: () => Promise<T>) {
  try {
    return { ok: true as const, data: await operacion() };
  } catch (error) {
    return { ok: false as const, error: normalizarError(error).toJSON() };
  }
}

async function ingresar(input: unknown) {
  const { id, usuario, venceEn } = await iniciarSesion(input);
  await escribirCookieSesion(id, venceEn);
  return usuario;
}

export async function loginAction(input: unknown) {
  return ejecutar(() => ingresar(input));
}

// Entra por el mismo login, con credenciales que el navegador nunca ve.
export async function loginDemoAction(rol: unknown) {
  return ejecutar(async () => {
    const credenciales = rolesDemo.includes(rol as RolDemo) ? credencialesDemo(rol as RolDemo) : null;
    const noDisponible = new ApiError(404, "NO_ENCONTRADO", "El modo demo no está disponible.");
    if (!credenciales) throw noDisponible;
    // Si la cuenta demo cambió, "email o contraseña incorrectos" confundiría a quien no escribió nada.
    return ingresar(credenciales).catch((error: unknown) => {
      throw error instanceof ApiError && error.code === "CREDENCIALES_INVALIDAS" ? noDisponible : error;
    });
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

export async function anularFacturaAction(facturaId: number, input: unknown) {
  return ejecutar(async () => anularFactura((await requireApiSession()).usuario, facturaId, input));
}
