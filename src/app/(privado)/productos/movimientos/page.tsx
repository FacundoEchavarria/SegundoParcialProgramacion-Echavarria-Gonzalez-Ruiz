import Link from "next/link";
import { claseCampo, clasePrincipal, claseSecundaria } from "@/components/acceso/estilos";
import {
  cargarPagina,
  Paginacion,
  TablaMovimientos,
  textoParametro,
  tiposMovimiento,
  type ParametrosPagina,
} from "@/components/productos/listados";
import { Card } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth-request";
import { listarMovimientos } from "@/services/stock";

export const metadata = { title: "Movimientos de stock | Gestión comercial" };

export default async function Movimientos({ searchParams }: { searchParams: ParametrosPagina }) {
  const actor = await requirePageUser();
  const params = await searchParams;
  const ruta = "/productos/movimientos";
  const filtros = {
    productoId: textoParametro(params.productoId),
    tipo: textoParametro(params.tipo),
    desde: textoParametro(params.desde),
    hasta: textoParametro(params.hasta),
    pageSize: textoParametro(params.pageSize),
  };
  const movimientos = await cargarPagina(ruta, filtros, () => listarMovimientos(actor, {
    ...filtros,
    page: textoParametro(params.page),
  }));

  return (
    <section className="grid gap-6">
      <header className="grid gap-3">
        <Link href="/productos" prefetch={false} className="w-fit text-sm font-medium text-primary underline">
          Volver a productos
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Movimientos de stock</h1>
      </header>

      <Card className="gap-0 overflow-hidden py-0">
        <form action={ruta} method="get" className="flex flex-wrap items-end gap-3 border-b p-4 sm:p-5">
          <label className="grid min-w-32 gap-1.5 text-sm font-medium">
            ID de producto
            <input className={claseCampo} type="number" name="productoId" min={1} defaultValue={filtros.productoId} />
          </label>
          <label className="grid min-w-28 grow gap-1.5 text-sm font-medium">
            Tipo
            <select className={claseCampo} name="tipo" defaultValue={filtros.tipo ?? ""}>
              <option value="">Todos</option>
              {Object.entries(tiposMovimiento).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>{etiqueta}</option>
              ))}
            </select>
          </label>
          <label className="grid grow gap-1.5 text-sm font-medium">
            Desde
            <input className={claseCampo} type="date" name="desde" defaultValue={filtros.desde} />
          </label>
          <label className="grid grow gap-1.5 text-sm font-medium">
            Hasta
            <input className={claseCampo} type="date" name="hasta" defaultValue={filtros.hasta} />
          </label>
          <button className={clasePrincipal}>Filtrar</button>
          {Object.values(filtros).some((valor) => valor !== undefined) && (
            <Link href={ruta} prefetch={false} className={claseSecundaria}>Limpiar</Link>
          )}
        </form>

        <TablaMovimientos movimientos={movimientos.data} mostrarProducto />
        <Paginacion ruta={ruta} filtros={filtros} pagina={movimientos} />
      </Card>
    </section>
  );
}
