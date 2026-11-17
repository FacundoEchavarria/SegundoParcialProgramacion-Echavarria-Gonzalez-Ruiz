import { leerJson, rutaConSesion } from "@/lib/api";
import { editarCategoria } from "@/services/productos";

export function PATCH(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    return Response.json(await editarCategoria(usuario, id, await leerJson(request)));
  });
}
