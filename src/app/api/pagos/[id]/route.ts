import { rutaConSesion } from "@/lib/api";
import { obtenerPago } from "@/services/pagos";

export function GET(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    const { recibo } = await obtenerPago(usuario, id);
    return Response.json(recibo);
  });
}
