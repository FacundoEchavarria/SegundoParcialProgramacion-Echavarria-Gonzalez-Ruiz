import { rutaConSesion } from "@/lib/api";
import { restablecerPassword } from "@/services/usuarios";

export function POST(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    return Response.json(await restablecerPassword(usuario, id));
  });
}
