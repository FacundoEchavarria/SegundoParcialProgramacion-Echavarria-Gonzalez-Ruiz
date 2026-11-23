import Link from "next/link";
import { CampoFiltro, EncabezadoPagina, EntradaFiltro, FormularioFiltros, Panel, SelectorFiltro } from "@/components/pagina";
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
          <FormularioFiltros action={ruta}>
            <Grilla gap="sm" className="items-end gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-[8rem_repeat(3,minmax(0,1fr))_auto]">
              <CampoFiltro etiqueta="ID de producto">
                <EntradaFiltro type="number" name="productoId" min={1} defaultValue={filtros.productoId} />
              </CampoFiltro>
              <CampoFiltro etiqueta="Tipo">
                <SelectorFiltro name="tipo" defaultValue={filtros.tipo ?? ""} vacio="Todos" opciones={Object.entries(tiposMovimiento)} />
              </CampoFiltro>
              <CampoFiltro etiqueta="Desde">
                <EntradaFiltro type="date" name="desde" defaultValue={filtros.desde} />
              </CampoFiltro>
              <CampoFiltro etiqueta="Hasta">
                <EntradaFiltro type="date" name="hasta" defaultValue={filtros.hasta} />
              </CampoFiltro>
              <Fila>
                <Button>Filtrar</Button>
                {Object.values(filtros).some((valor) => valor !== undefined) && (
                  <Button asChild variant="ghost"><Link href={ruta} prefetch={false}>Limpiar filtros</Link></Button>
                )}
              </Fila>
            </Grilla>
          </FormularioFiltros>

          <TablaMovimientos movimientos={movimientos.data} mostrarProducto />
          <Paginacion ruta={ruta} filtros={filtros} pagina={movimientos} />
        </Panel>
      </Pila>
    </Grilla>
  );
}
