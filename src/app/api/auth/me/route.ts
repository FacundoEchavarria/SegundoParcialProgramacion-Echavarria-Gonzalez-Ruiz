import { rutaConSesion } from "@/lib/api";

export function GET(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => Response.json(usuario));
}
