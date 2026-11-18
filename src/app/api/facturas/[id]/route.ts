import { rutaConSesion } from "@/lib/api";
import { obtenerFactura } from "@/services/facturas";

export function GET(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async () => {
    const { id } = await contexto.params;
    return Response.json(await obtenerFactura(id));
  });
}
