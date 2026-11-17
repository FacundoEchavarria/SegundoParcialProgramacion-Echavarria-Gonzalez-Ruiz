import { leerJson, rutaConSesion } from "@/lib/api";
import { editarProducto, obtenerProducto } from "@/services/productos";

export function GET(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    return Response.json(await obtenerProducto(usuario, id));
  });
}

export function PATCH(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    return Response.json(await editarProducto(usuario, id, await leerJson(request)));
  });
}
