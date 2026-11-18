import { leerJson, rutaConSesion } from "@/lib/api";
import { anularFactura } from "@/services/facturas";

export function POST(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    return Response.json(await anularFactura(usuario, id, await leerJson(request)));
  });
}
