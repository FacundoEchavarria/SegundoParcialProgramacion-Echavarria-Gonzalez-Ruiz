import Link from "next/link";
import { claseCampo, clasePrincipal, claseSecundaria } from "@/components/acceso/estilos";
import { cargarPagina, Paginacion, textoParametro, type ParametrosPagina } from "@/components/productos/listados";
import { Card } from "@/components/ui/card";
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

  const filtroCampo = "grid min-w-0 gap-1.5 text-sm font-medium";
  return (
    <section className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Facturas</h1>
        <Link href="/ventas/nueva" className={clasePrincipal} prefetch={false}>Nueva venta</Link>
      </header>

      <Card className="gap-0 overflow-hidden py-0">
        <form action="/ventas" method="get" className="grid gap-4 border-b p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className={filtroCampo}>
              Número o nombre del cliente
              <input className={claseCampo} type="search" name="q" maxLength={150} defaultValue={filtros.q} />
            </label>
            <label className={filtroCampo}>
              Desde
              <input className={claseCampo} type="date" name="desde" defaultValue={filtros.desde} />
            </label>
            <label className={filtroCampo}>
              Hasta
              <input className={claseCampo} type="date" name="hasta" defaultValue={filtros.hasta} />
            </label>
            <label className={filtroCampo}>
              Cliente
              <select className={claseCampo} name="clienteId" defaultValue={filtros.clienteId}>
                <option value="">Todos</option>
                {clientes.map(({ id, nombre }) => <option key={id} value={id}>{nombre}</option>)}
              </select>
            </label>
            <label className={filtroCampo}>
              Vendedor
              <select className={claseCampo} name="vendedorId" defaultValue={filtros.vendedorId}>
                <option value="">Todos</option>
                {vendedores.map(({ id, nombre }) => <option key={id} value={id}>{nombre}</option>)}
              </select>
            </label>
            <label className={filtroCampo}>
              Forma de pago
              <select className={claseCampo} name="forma" defaultValue={filtros.forma}>
                <option value="">Todas</option>
                {Object.entries(formasPago).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
              </select>
            </label>
            <label className={filtroCampo}>
              Estado
              <select className={claseCampo} name="estado" defaultValue={filtros.estado}>
                <option value="">Todos</option>
                {Object.entries(estadosFactura).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
              </select>
            </label>
            <label className={filtroCampo}>
              Resultados por página
              <input className={claseCampo} type="number" name="pageSize" min={1} max={100} defaultValue={facturas.pageSize} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={clasePrincipal}>Filtrar</button>
            {Object.values(filtros).some(Boolean) && (
              <Link href="/ventas" className={claseSecundaria} prefetch={false}>Limpiar</Link>
            )}
          </div>
        </form>

        <dl className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3 sm:px-5">
          <dt className="text-sm font-medium text-muted-foreground">Total emitido según los filtros</dt>
          <dd className="font-semibold tabular-nums">{precioEnPesos(facturas.totalEmitido)}</dd>
        </dl>
        {facturas.data.length === 0 ? (
          <p className="p-5 text-muted-foreground">No hay facturas que coincidan con la búsqueda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table aria-label="Facturas" className="w-full text-left text-sm">
              <thead className="border-b bg-background text-muted-foreground [&_th]:px-4 [&_th]:py-3">
                <tr>
                  <th scope="col">Número</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Vendedor</th>
                  <th scope="col">Forma de pago</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y [&_td]:px-4 [&_td]:py-3">
                {facturas.data.map((factura) => (
                  <tr key={factura.id} className="align-top">
                    <td>
                      <Link href={`/ventas/${factura.id}`} className="font-semibold whitespace-nowrap text-primary underline" prefetch={false}>
                        {factura.numeroFormateado}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap">
                      <time dateTime={factura.fecha}>{fechaFactura(factura.fecha)}</time>
                    </td>
                    <td className="min-w-24 break-words">{factura.cliente?.nombre ?? "Consumidor final"}</td>
                    <td className="min-w-24 break-words">{factura.vendedor.nombre}</td>
                    <td>{formasPago[factura.forma]}</td>
                    <td>
                      <span className={factura.estado === "anulada" ? "font-semibold text-red-900" : "text-muted-foreground"}>
                        {estadosFactura[factura.estado]}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap tabular-nums">{precioEnPesos(factura.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion ruta="/ventas" filtros={filtros} pagina={facturas} />
      </Card>
    </section>
  );
}
