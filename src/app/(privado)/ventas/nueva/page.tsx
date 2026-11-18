import { NuevaVenta } from "@/components/ventas/nueva-venta";
import { requirePageUser } from "@/lib/auth-request";
import { proximoNumeroFactura } from "@/services/facturas";

export const metadata = { title: "Nueva venta | Gestión comercial" };

export default async function PaginaNuevaVenta() {
  await requirePageUser();
  const { numeroFormateado } = await proximoNumeroFactura();
  return <NuevaVenta numeroEstimado={numeroFormateado} />;
}
