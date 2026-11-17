import { leerJson, rutaConSesion } from "@/lib/api";
import { crearCategoria, listarCategorias } from "@/services/productos";

export function GET(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => Response.json(await listarCategorias(usuario)));
}

export function POST(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => {
    const categoria = await crearCategoria(usuario, await leerJson(request));
    return Response.json(categoria, { status: 201 });
  });
}
