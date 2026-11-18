import { leerJson, rutaConSesion } from "@/lib/api";
import { confirmarVenta } from "@/services/facturas";

export function POST(request: Request) {
  return rutaConSesion(request, async ({ usuario }) => {
    const factura = await confirmarVenta(usuario, await leerJson(request));
    return Response.json(factura, { status: 201 });
  });
}
