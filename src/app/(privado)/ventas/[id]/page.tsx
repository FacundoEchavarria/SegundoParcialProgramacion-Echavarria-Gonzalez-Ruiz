import Link from "next/link";
import { notFound } from "next/navigation";
import { claseSecundaria } from "@/components/acceso/estilos";
import { BotonImprimir } from "@/components/clientes/boton-imprimir";
import { Card } from "@/components/ui/card";
import { estadosFactura, fechaFactura, formasPago } from "@/components/ventas/facturas";
import { FormularioAnulacion } from "@/components/ventas/formulario-anulacion";
import { ApiError } from "@/lib/api-error";
import { requirePageUser } from "@/lib/auth-request";
import { precioEnPesos } from "@/lib/formatos";
import { obtenerFactura } from "@/services/facturas";

export const metadata = { title: "Detalle de factura | Gestión comercial" };

export default async function DetalleFactura({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await requirePageUser();
  const { id } = await params;
  const factura = await obtenerFactura(id).catch((error: unknown) => {
    if (error instanceof ApiError && (error.status === 404 || error.status === 422)) notFound();
    throw error;
  });
  const { anulacion, cliente, estado, fecha, numeroFormateado, pago, vendedor } = factura;

  return (
    <section className="mx-auto grid max-w-3xl gap-4 print:block print:max-w-none">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Link className={claseSecundaria} href="/ventas" prefetch={false}>Volver a facturas</Link>
        <BotonImprimir etiqueta="Imprimir factura" />
        {usuario.rol === "admin" && estado === "emitida" && (
          <FormularioAnulacion facturaId={factura.id} numero={numeroFormateado} />
        )}
      </div>

      <Card className="gap-5 p-5 sm:p-6 print:block print:space-y-5 print:rounded-none print:border-0 print:p-0 print:text-black print:shadow-none">
        <header className="flex flex-wrap justify-between gap-3 border-b pb-4 print:break-inside-avoid">
          <div>
            <p className="font-semibold">Ferretería Demo</p>
            <p className="text-sm">Av. Ejemplo 123, Buenos Aires</p>
          </div>
          <p className="text-sm font-semibold uppercase">Comprobante interno sin validez fiscal</p>
          <div className="w-full">
            <h1 className="text-2xl font-semibold tabular-nums">Factura {numeroFormateado}</h1>
            <p className="text-sm">
              <time dateTime={fecha}>{fechaFactura(fecha)}</time>
            </p>
          </div>
        </header>

        <dl className="grid gap-3 text-sm sm:grid-cols-3 print:grid-cols-3 print:break-inside-avoid [&_dt]:font-semibold">
          <div>
            <dt>Comprador</dt>
            <dd className="break-words">{cliente?.nombre ?? "Consumidor final"}</dd>
            {cliente && <dd>{cliente.tipoDoc} {cliente.nroDoc}</dd>}
            {cliente?.domicilio && <dd className="break-words">{cliente.domicilio}</dd>}
          </div>
          <div>
            <dt>Vendedor</dt>
            <dd className="break-words">{vendedor.nombre}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd className={estado === "anulada" ? "font-semibold text-red-900 print:text-black" : undefined}>
              {estadosFactura[estado]}
            </dd>
          </div>
        </dl>

        {anulacion && (
          <section className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm print:break-inside-avoid print:border-black print:bg-transparent">
            <h2 className="mb-1 font-semibold">Datos de anulación</h2>
            <dl className="grid gap-2 [&_dt]:font-medium">
              <div>
                <dt>Fecha de anulación</dt>
                <dd><time dateTime={anulacion.fecha}>{fechaFactura(anulacion.fecha)}</time></dd>
              </div>
              <div>
                <dt>Responsable</dt>
                <dd className="break-words">{anulacion.usuario.nombre}</dd>
              </div>
              <div>
                <dt>Motivo</dt>
                <dd className="whitespace-pre-wrap break-words">{anulacion.motivo}</dd>
              </div>
              {anulacion.importeDevuelto !== undefined && (
                <div>
                  <dt>Devolución de caja</dt>
                  <dd>{precioEnPesos(anulacion.importeDevuelto)}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <div className="overflow-x-auto print:overflow-visible">
          <table aria-label="Detalle de la factura" className="w-full text-left text-sm">
            <thead className="border-b bg-background [&_th]:px-2 [&_th]:py-2">
              <tr>
                <th scope="col">Producto</th>
                <th scope="col" className="text-right">Cantidad</th>
                <th scope="col" className="text-right">Precio unitario</th>
                <th scope="col" className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y [&_td]:px-2 [&_td]:py-2">
              {factura.items.map((item) => (
                <tr key={item.productoId} className="align-top print:break-inside-avoid">
                  <td className="min-w-28 break-words">
                    <p className="font-medium">{item.descripcion}</p>
                    <p className="text-xs">{item.codigo}</p>
                  </td>
                  <td className="text-right tabular-nums">{item.cantidad}</td>
                  <td className="text-right whitespace-nowrap tabular-nums">{precioEnPesos(item.precioUnitario)}</td>
                  <td className="text-right whitespace-nowrap tabular-nums">{precioEnPesos(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="grid gap-2 border-t pt-4 text-sm print:break-inside-avoid [&>div]:flex [&>div]:justify-between [&>div]:gap-3 [&_dd]:font-medium [&_dd]:tabular-nums">
          <div className="text-xl font-semibold"><dt>Total</dt><dd>{precioEnPesos(factura.total)}</dd></div>
          <div><dt>Forma de pago</dt><dd>{formasPago[pago.forma]}</dd></div>
          {pago.forma === "contado" && (
            <>
              <div><dt>Monto recibido</dt><dd>{precioEnPesos(pago.montoRecibido)}</dd></div>
              <div><dt>Vuelto</dt><dd>{precioEnPesos(pago.vuelto)}</dd></div>
            </>
          )}
          {pago.forma === "tarjeta" && (
            <div>
              <dt>Tarjeta</dt>
              <dd className="text-right">
                {pago.tarjeta.tipo === "debito" ? "Débito" : "Crédito"} · {pago.tarjeta.marca} · •••• {pago.tarjeta.ultimos4}
              </dd>
            </div>
          )}
          {factura.saldoCliente !== undefined && (
            <div><dt>Saldo al emitir</dt><dd>{precioEnPesos(factura.saldoCliente)}</dd></div>
          )}
        </dl>
      </Card>
    </section>
  );
}
