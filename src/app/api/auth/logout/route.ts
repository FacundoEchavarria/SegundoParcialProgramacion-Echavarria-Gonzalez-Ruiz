import { rutaConSesion } from "@/lib/api";
import { borrarCookieSesion } from "@/lib/auth-request";
import { cerrarSesion } from "@/services/auth";

export function POST(request: Request) {
  return rutaConSesion(request, async ({ id }) => {
    await cerrarSesion(id);
    await borrarCookieSesion();
    return new Response(null, { status: 204 });
  });
}
