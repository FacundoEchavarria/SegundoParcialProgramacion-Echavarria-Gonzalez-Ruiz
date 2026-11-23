import Link from "next/link";
import { Plus } from "lucide-react";
import { EstadoVacio } from "@/components/estados";
import { Insignia } from "@/components/insignia";
import { CampoFiltro, EncabezadoPagina, EntradaFiltro, Fecha, FormularioFiltros, Panel, SelectorFiltro } from "@/components/pagina";
import { Fila, Grilla, Texto } from "@/components/maquetacion";
import { cargarPagina, Paginacion, textoParametro, type ParametrosPagina } from "@/components/productos/listados";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { estadosFactura, fechaFactura, formasPago } from "@/components/ventas/facturas";
import { requirePageUser } from "@/lib/auth-request";
import { precioEnPesos } from "@/lib/formatos";
import { listarFacturas, opcionesFacturas } from "@/services/facturas";

export const metadata = { title: "Facturas | Gestión comercial" };

export default async function Ventas({ searchParams }: { searchParams: ParametrosPagina }) {
  await requirePageUser();
  const params = await searchParams;
  const filtros = {
    q: textoParametro(params.q),
    desde: textoParametro(params.desde),
    hasta: textoParametro(params.hasta),
    clienteId: textoParametro(params.clienteId),
    vendedorId: textoParametro(params.vendedorId),
    forma: textoParametro(params.forma),
    estado: textoParametro(params.estado),
    pageSize: textoParametro(params.pageSize),
  };
  const [facturas, { clientes, vendedores }] = await Promise.all([
    cargarPagina("/ventas", filtros, () => listarFacturas({ ...filtros, page: textoParametro(params.page) })),
    opcionesFacturas(),
  ]);

  return (
    <Grilla gap="lg">
      <EncabezadoPagina
        titulo="Facturas"
        acciones={<Button asChild><Link href="/ventas/nueva" prefetch={false}><Plus aria-hidden />Nueva venta</Link></Button>}
      />

      <Panel className="overflow-hidden">
        <FormularioFiltros action="/ventas" className="grid gap-4">
          <Grilla gap="sm" className="gap-x-3 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            <CampoFiltro etiqueta="Número o nombre del cliente">
              <EntradaFiltro type="search" name="q" maxLength={150} defaultValue={filtros.q} />
            </CampoFiltro>
            <CampoFiltro etiqueta="Desde">
              <EntradaFiltro type="date" name="desde" defaultValue={filtros.desde} />
            </CampoFiltro>
            <CampoFiltro etiqueta="Hasta">
              <EntradaFiltro type="date" name="hasta" defaultValue={filtros.hasta} />
            </CampoFiltro>
            <CampoFiltro etiqueta="Cliente">
              <SelectorFiltro name="clienteId" defaultValue={filtros.clienteId} vacio="Todos"
                opciones={clientes.map(({ id, nombre }) => [id, nombre])} />
            </CampoFiltro>
            <CampoFiltro etiqueta="Vendedor">
              <SelectorFiltro name="vendedorId" defaultValue={filtros.vendedorId} vacio="Todos"
                opciones={vendedores.map(({ id, nombre }) => [id, nombre])} />
            </CampoFiltro>
            <CampoFiltro etiqueta="Forma de pago">
              <SelectorFiltro name="forma" defaultValue={filtros.forma} vacio="Todas" opciones={Object.entries(formasPago)} />
            </CampoFiltro>
            <CampoFiltro etiqueta="Estado">
              <SelectorFiltro name="estado" defaultValue={filtros.estado} vacio="Todos" opciones={Object.entries(estadosFactura)} />
            </CampoFiltro>
            <CampoFiltro etiqueta="Resultados por página">
              <EntradaFiltro type="number" name="pageSize" min={1} max={100} defaultValue={facturas.pageSize} />
            </CampoFiltro>
          </Grilla>
          <Fila>
            <Button>Filtrar</Button>
            {Object.values(filtros).some(Boolean) && (
              <Button asChild variant="ghost"><Link href="/ventas" prefetch={false}>Limpiar filtros</Link></Button>
            )}
          </Fila>
        </FormularioFiltros>

        <Fila as="dl" gap="md" className="items-baseline justify-between border-b bg-tinta-50 px-4 py-3 sm:px-5">
          <Texto as="dt" tono="secundario" className="font-medium">Total emitido según los filtros</Texto>
          <Texto as="dd" className="angosta subrayado-doble pb-2 text-xl font-bold text-tapa">{precioEnPesos(facturas.totalEmitido)}</Texto>
        </Fila>
        {facturas.data.length === 0 ? (
          <EstadoVacio>No hay facturas que coincidan con la búsqueda.</EstadoVacio>
        ) : (
          <Table aria-label="Facturas">
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Forma de pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas.data.map((factura) => (
                <TableRow key={factura.id} className={factura.estado === "anulada" ? "text-muted-foreground" : undefined}>
                  <TableCell>
                    <Link href={`/ventas/${factura.id}`} className="font-semibold text-tapa hover:underline" prefetch={false}>
                      {factura.numeroFormateado}
                    </Link>
                  </TableCell>
                  <TableCell><Fecha iso={factura.fecha}>{fechaFactura(factura.fecha)}</Fecha></TableCell>
                  <TableCell className="min-w-24 whitespace-normal break-words">{factura.cliente?.nombre ?? "Consumidor final"}</TableCell>
                  <TableCell className="min-w-24 whitespace-normal break-words">{factura.vendedor.nombre}</TableCell>
                  <TableCell>{formasPago[factura.forma]}</TableCell>
                  <TableCell>
                    <Insignia tono={factura.estado === "anulada" ? "peligro" : "exito"}>{estadosFactura[factura.estado]}</Insignia>
                  </TableCell>
                  <TableCell className={factura.estado === "anulada" ? "text-right line-through" : "text-right font-semibold"}>
                    {precioEnPesos(factura.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Paginacion ruta="/ventas" filtros={filtros} pagina={facturas} />
      </Panel>
    </Grilla>
  );
}
