import { leerJson, rutaConSesion } from "@/lib/api";
import { listarMovimientos, registrarMovimiento } from "@/services/stock";

export function GET(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    const input = Object.fromEntries(new URL(request.url).searchParams);
    return Response.json(await listarMovimientos(usuario, input, id));
  });
}

export function POST(request: Request, contexto: { params: Promise<{ id: string }> }) {
  return rutaConSesion(request, async ({ usuario }) => {
    const { id } = await contexto.params;
    const movimiento = await registrarMovimiento(usuario, id, await leerJson(request));
    return Response.json(movimiento, { status: 201 });
  });
}
