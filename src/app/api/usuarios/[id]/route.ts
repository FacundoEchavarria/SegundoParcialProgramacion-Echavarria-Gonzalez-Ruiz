import { leerJson, rutaConSesion } from "@/lib/api";
import { editarUsuario } from "@/services/usuarios";

export function PATCH(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    const actualizado = await editarUsuario(usuario, id, await leerJson(request));
    return Response.json(actualizado);
  });
}
