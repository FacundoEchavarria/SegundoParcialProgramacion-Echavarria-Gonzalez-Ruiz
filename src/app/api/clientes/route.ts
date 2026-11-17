import { leerJson, rutaConSesion } from "@/lib/api";
import { crearCliente, listarClientes } from "@/services/clientes";

export function GET(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => {
    const input = Object.fromEntries(new URL(request.url).searchParams);
    return Response.json(await listarClientes(usuario, input));
  });
}

export function POST(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => {
    const cliente = await crearCliente(usuario, await leerJson(request));
    return Response.json(cliente, { status: 201 });
  });
}
