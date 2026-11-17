import { rutaConSesion } from "@/lib/api";
import { obtenerCuenta } from "@/services/cuenta-corriente";

export function GET(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    const input = Object.fromEntries(new URL(request.url).searchParams);
    return Response.json(await obtenerCuenta(usuario, id, input));
  });
}
