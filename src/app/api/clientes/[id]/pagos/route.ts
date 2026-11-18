import { leerJson, rutaConSesion } from "@/lib/api";
import { registrarPago } from "@/services/pagos";

export function POST(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    const recibo = await registrarPago(usuario, id, await leerJson(request));
    return Response.json(recibo, { status: 201 });
  });
}
