import { rutaConSesion } from "@/lib/api";
import { proximoNumeroFactura } from "@/services/facturas";

export function GET(request: Request) {
  return rutaConSesion(request, async () => Response.json(await proximoNumeroFactura()));
}
