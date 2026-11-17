import { leerJson, rutaConSesion } from "@/lib/api";
import { crearProducto, listarProductos } from "@/services/productos";

export function GET(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => {
    const input = Object.fromEntries(new URL(request.url).searchParams);
    return Response.json(await listarProductos(usuario, input));
  });
}

export function POST(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => {
    const producto = await crearProducto(usuario, await leerJson(request));
    return Response.json(producto, { status: 201 });
  });
}
