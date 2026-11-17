import { leerJson, rutaConSesion } from "@/lib/api";
import { crearUsuario, listarUsuarios } from "@/services/usuarios";

export function GET(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => {
    const input = Object.fromEntries(new URL(request.url).searchParams);
    return Response.json(await listarUsuarios(usuario, input));
  });
}

export function POST(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => {
    const nuevo = await crearUsuario(usuario, await leerJson(request));
    return Response.json(nuevo, { status: 201 });
  });
}
