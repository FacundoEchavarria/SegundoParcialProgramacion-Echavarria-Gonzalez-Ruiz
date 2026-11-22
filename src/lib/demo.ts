import "server-only";
import { ApiError } from "@/lib/api-error";

export const rolesDemo = ["admin", "vendedor"] as const;
export type RolDemo = (typeof rolesDemo)[number];

// Las credenciales quedan en el servidor. Sin estas variables, el botón del rol no aparece.
export function credencialesDemo(rol: RolDemo) {
  const prefijo = rol === "admin" ? "DEMO_ADMIN" : "DEMO_VENDEDOR";
  const email = process.env[`${prefijo}_EMAIL`]?.trim();
  const password = process.env[`${prefijo}_PASSWORD`];
  return email && password ? { email, password } : null;
}

export function rolesDemoDisponibles() {
  return rolesDemo.filter((rol) => credencialesDemo(rol) !== null);
}

// Si un visitante cambiara una cuenta demo, los botones del login dejarían de funcionar para todos.
export function exigirCuentaModificable(email: string) {
  if (rolesDemo.some((rol) => credencialesDemo(rol)?.email.toLowerCase() === email.toLowerCase())) {
    throw new ApiError(403, "CUENTA_DEMO", "Las cuentas del modo demo no se pueden modificar.");
  }
}
