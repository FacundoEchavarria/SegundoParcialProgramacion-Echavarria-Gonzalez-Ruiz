import Link from "next/link";
import { CampoFiltro, EncabezadoPagina, Panel } from "@/components/pagina";
import { claseCampo } from "@/components/acceso/estilos";
import { Fila, Grilla, Pila } from "@/components/maquetacion";
import { Pestanas, pestanasProductos } from "@/components/pestanas";
import { cargarPagina, Paginacion, TablaMovimientos, textoParametro, tiposMovimiento, type ParametrosPagina } from "@/components/productos/listados";
import { Button } from "@/components/ui/button";
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
    <Grilla gap="lg">
      <EncabezadoPagina titulo="Productos" descripcion="Movimientos de stock de todo el catálogo." />
      <Pila gap="md">
        <Pestanas etiqueta="Secciones de productos" pestanas={pestanasProductos} />
        <Panel className="overflow-hidden">
          <form action={ruta} method="get" className="border-b p-4 sm:p-5">
            <Grilla gap="sm" className="items-end gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-[8rem_repeat(3,minmax(0,1fr))_auto]">
              <CampoFiltro etiqueta="ID de producto">
                <input className={claseCampo} type="number" name="productoId" min={1} defaultValue={filtros.productoId} />
              </CampoFiltro>
              <CampoFiltro etiqueta="Tipo">
                <select className={claseCampo} name="tipo" defaultValue={filtros.tipo ?? ""}>
                  <option value="">Todos</option>
                  {Object.entries(tiposMovimiento).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>{etiqueta}</option>
                  ))}
                </select>
              </CampoFiltro>
              <CampoFiltro etiqueta="Desde">
                <input className={claseCampo} type="date" name="desde" defaultValue={filtros.desde} />
              </CampoFiltro>
              <CampoFiltro etiqueta="Hasta">
                <input className={claseCampo} type="date" name="hasta" defaultValue={filtros.hasta} />
              </CampoFiltro>
              <Fila>
                <Button>Filtrar</Button>
                {Object.values(filtros).some((valor) => valor !== undefined) && (
                  <Button asChild variant="ghost"><Link href={ruta} prefetch={false}>Limpiar filtros</Link></Button>
                )}
              </Fila>
            </Grilla>
          </form>

          <TablaMovimientos movimientos={movimientos.data} mostrarProducto />
          <Paginacion ruta={ruta} filtros={filtros} pagina={movimientos} />
        </Panel>
      </Pila>
    </Grilla>
  );
}
