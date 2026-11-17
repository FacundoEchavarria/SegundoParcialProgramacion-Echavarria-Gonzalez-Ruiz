import { rutaConSesion } from "@/lib/api";
import { listarMovimientos } from "@/services/stock";

export function GET(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => {
    const input = Object.fromEntries(new URL(request.url).searchParams);
    return Response.json(await listarMovimientos(usuario, input));
  });
}
