import { leerJson, rutaConSesion } from "@/lib/api";
import { confirmarVenta, listarFacturas } from "@/services/facturas";

export function GET(request: Request) {
  return rutaConSesion(request, async () => {
    const filtros = Object.fromEntries(new URL(request.url).searchParams);
    return Response.json(await listarFacturas(filtros));
  });
}

export function POST(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => {
    const factura = await confirmarVenta(usuario, await leerJson(request));
    return Response.json(factura, { status: 201 });
  });
}
