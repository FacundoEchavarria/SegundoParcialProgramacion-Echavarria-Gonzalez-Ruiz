import { ListadoClientes } from "@/components/clientes/listados";
import type { ParametrosPagina } from "@/components/productos/listados";
import { requirePageUser } from "@/lib/auth-request";

export const metadata = { title: "Saldos pendientes | Gestión comercial" };

export default async function Saldos({ searchParams }: { searchParams: ParametrosPagina }) {
  const actor = await requirePageUser();
  const { q, page, pageSize } = await searchParams;
  return <ListadoClientes actor={actor} q={q} page={page} pageSize={pageSize} saldos />;
}
