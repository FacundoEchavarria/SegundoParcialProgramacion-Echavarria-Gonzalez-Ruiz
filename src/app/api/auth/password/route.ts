import { leerJson, rutaConSesion } from "@/lib/api";
import { borrarCookieSesion } from "@/lib/auth-request";
import { cambiarPassword } from "@/services/auth";

export function PUT(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => {
    await cambiarPassword(usuario, await leerJson(request));
    await borrarCookieSesion();
    return new Response(null, { status: 204 });
  });
}
