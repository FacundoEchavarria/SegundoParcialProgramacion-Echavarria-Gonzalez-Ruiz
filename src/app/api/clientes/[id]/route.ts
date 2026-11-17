import { leerJson, rutaConSesion } from "@/lib/api";
import { editarCliente, obtenerCliente } from "@/services/clientes";

export function GET(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    return Response.json(await obtenerCliente(usuario, id));
  });
}

export function PATCH(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    const cliente = await editarCliente(usuario, id, await leerJson(request));
    return Response.json(cliente);
  });
}
