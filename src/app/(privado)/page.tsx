import Link from "next/link";
import { ListaVacia } from "@/components/acceso/lista-vacia";
import { GraficoFormasDePago, GraficoVentasDiarias } from "@/components/tablero/graficos";
import { Card } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth-request";
import { formatearDia, precioEnPesos } from "@/lib/formatos";
import { obtenerTablero } from "@/services/tablero";

export const metadata = { title: "Inicio | Gestión comercial" };

const claseIndicador = "min-w-0 gap-1 px-5 py-4";
const claseEtiqueta = "text-sm font-medium text-muted-foreground";
const claseValor = "text-2xl font-semibold break-words tabular-nums";

export default async function Inicio() {
  await requirePageUser();
  const { hoy, mes, cuentasCorrientes, bajoMinimo, ventasDiarias, porFormaDePago, masVendidos } = await obtenerTablero();

  return (
    <section className="grid gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Tablero de inicio</h1>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores comerciales">
        <Card className={claseIndicador}>
          <dt className={claseEtiqueta}>Ventas de hoy</dt>
          <dd className={claseValor}>{precioEnPesos(hoy.importe)}</dd>
          <dd className={claseEtiqueta}>{hoy.cantidad} {hoy.cantidad === 1 ? "factura" : "facturas"}</dd>
        </Card>
        <Card className={claseIndicador}>
          <dt className={claseEtiqueta}>Ventas del mes</dt>
          <dd className={claseValor}>{precioEnPesos(mes.importe)}</dd>
          <dd className={claseEtiqueta}>{mes.cantidad} {mes.cantidad === 1 ? "factura" : "facturas"}</dd>
          <dd className={claseEtiqueta}>Ticket promedio {precioEnPesos(mes.ticketPromedio)}</dd>
        </Card>
        <Card className={claseIndicador}>
          <dt className={claseEtiqueta}>Total adeudado en cuenta corriente</dt>
          <dd className={claseValor}>{precioEnPesos(cuentasCorrientes.totalAdeudado)}</dd>
          <dd className={claseEtiqueta}>
            {cuentasCorrientes.clientesConSaldo} {cuentasCorrientes.clientesConSaldo === 1 ? "cliente" : "clientes"} con saldo
          </dd>
        </Card>
        <Card className={claseIndicador}>
          <dt className={claseEtiqueta}>Productos bajo el mínimo</dt>
          <dd className={claseValor}>{bajoMinimo.cantidad}</dd>
          <dd>
            <Link href="/productos?bajoMinimo=true" prefetch={false} className="text-sm font-medium text-primary underline underline-offset-4">
              Ver productos bajo el mínimo
            </Link>
          </dd>
        </Card>
      </dl>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="min-w-0 gap-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">Ventas diarias</h2>
            <p className={claseEtiqueta}>Últimos 30 días</p>
          </div>
          <GraficoVentasDiarias ventasDiarias={ventasDiarias} />
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-primary">Ver importes por día</summary>
            <table className="mt-2 w-full text-left" aria-label="Importes de venta por día">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th scope="col" className="py-1.5">Fecha</th>
                  <th scope="col" className="py-1.5 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y tabular-nums">
                {ventasDiarias.map(({ fecha, importe }) => (
                  <tr key={fecha}>
                    <td className="py-1.5"><time dateTime={fecha}>{formatearDia(fecha)}</time></td>
                    <td className="py-1.5 text-right">{precioEnPesos(importe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </Card>
        <Card className="min-w-0 gap-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">Ventas por forma de pago</h2>
            <p className={claseEtiqueta}>Mes en curso</p>
          </div>
          <GraficoFormasDePago porFormaDePago={porFormaDePago} />
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <h2 className="p-5 text-lg font-semibold">Productos más vendidos del mes</h2>
        {masVendidos.length === 0 ? (
          <ListaVacia className="border-t p-5">Todavía no hay productos vendidos este mes.</ListaVacia>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Productos más vendidos del mes">
              <thead className="border-y bg-background text-muted-foreground [&_th]:px-3 [&_th]:py-3 sm:[&_th]:px-5">
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col" className="text-right">Unidades</th>
                  <th scope="col" className="text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y [&_td]:px-3 [&_td]:py-3 sm:[&_td]:px-5">
                {masVendidos.map(({ productoId, codigo, descripcion, unidades, importe }) => (
                  <tr key={productoId}>
                    <td className="min-w-28 break-words">
                      <Link href={`/productos/${productoId}`} prefetch={false} className="font-medium text-primary underline underline-offset-4">
                        {descripcion}
                      </Link>
                      <p className="text-xs text-muted-foreground">{codigo}</p>
                    </td>
                    <td className="text-right tabular-nums">{unidades}</td>
                    <td className="text-right whitespace-nowrap tabular-nums">{precioEnPesos(importe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
