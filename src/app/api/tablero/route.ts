import { rutaConSesion } from "@/lib/api";
import { obtenerTablero } from "@/services/tablero";

export function GET(request: Request) {
  return rutaConSesion(request, async () => Response.json(await obtenerTablero()));
}
