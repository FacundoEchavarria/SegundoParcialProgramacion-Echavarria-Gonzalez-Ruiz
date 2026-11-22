import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban } from "lucide-react";
import { BotonImprimir } from "@/components/clientes/boton-imprimir";
import { Fila, Grilla, Pila, Texto, Titulo } from "@/components/maquetacion";
import { Dato, Insignia, Panel } from "@/components/pagina";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <Pila gap="md" className="mx-auto max-w-3xl print:block print:max-w-none">
      <Fila className="print:hidden">
        <Button asChild variant="ghost"><Link href="/ventas" prefetch={false}><ArrowLeft aria-hidden />Volver a facturas</Link></Button>
        <Fila className="ml-auto">
          {usuario.rol === "admin" && estado === "emitida" && (
            <FormularioAnulacion facturaId={factura.id} numero={numeroFormateado} />
          )}
          <BotonImprimir etiqueta="Imprimir factura" />
        </Fila>
      </Fila>

      <Panel className="grid gap-6 p-5 sm:p-8 print:block print:space-y-5 print:rounded-none print:border-0 print:p-0 print:text-black">
        <Fila as="header" gap="md" className="items-start justify-between border-b pb-5 print:break-inside-avoid">
          <Pila gap="xs">
            <Texto className="font-semibold">Ferretería Demo</Texto>
            <Texto tono="secundario">Av. Ejemplo 123, Buenos Aires</Texto>
            <Texto tono="secundario" className="text-xs font-semibold tracking-[0.06em] uppercase">Comprobante interno sin validez fiscal</Texto>
          </Pila>
          <Pila gap="xs" className="items-end text-right">
            <Insignia tono={estado === "anulada" ? "peligro" : "exito"}>{estadosFactura[estado]}</Insignia>
            <Titulo className="whitespace-nowrap">Factura {numeroFormateado}</Titulo>
            <Texto tono="secundario"><time dateTime={fecha}>{fechaFactura(fecha)}</time></Texto>
          </Pila>
        </Fila>

        <Grilla as="dl" className="sm:grid-cols-2 print:grid-cols-2 print:break-inside-avoid">
          <Dato etiqueta="Comprador">
            {cliente?.nombre ?? "Consumidor final"}
            {cliente && <Texto as="span" tono="secundario" className="block">{cliente.tipoDoc} {cliente.nroDoc}</Texto>}
            {cliente?.domicilio && <Texto as="span" tono="secundario" className="block">{cliente.domicilio}</Texto>}
          </Dato>
          <Dato etiqueta="Vendedor">{vendedor.nombre}</Dato>
        </Grilla>

        {anulacion && (
          <Pila as="section" gap="sm" className="rounded-lg bg-peligro-fondo p-4 text-peligro print:break-inside-avoid print:border print:border-black print:bg-transparent print:text-black">
            <Fila as="h2" gap="sm" className="font-semibold"><Ban aria-hidden className="size-4" />Factura anulada</Fila>
            <Grilla as="dl" gap="sm" className="text-foreground sm:grid-cols-2">
              <Dato etiqueta="Fecha de anulación"><time dateTime={anulacion.fecha}>{fechaFactura(anulacion.fecha)}</time></Dato>
              <Dato etiqueta="Responsable">{anulacion.usuario.nombre}</Dato>
              <Dato etiqueta="Motivo" className="sm:col-span-2"><span className="whitespace-pre-wrap">{anulacion.motivo}</span></Dato>
            </Grilla>
          </Pila>
        )}

        <Table aria-label="Detalle de la factura">
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio unitario</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factura.items.map((item) => (
              <TableRow key={item.productoId} className="align-top print:break-inside-avoid">
                <TableCell className="min-w-28 whitespace-normal break-words">
                  <Texto className="font-medium">{item.descripcion}</Texto>
                  <Texto tono="secundario" className="text-xs">{item.codigo}</Texto>
                </TableCell>
                <TableCell className="text-right">{item.cantidad}</TableCell>
                <TableCell className="text-right">{precioEnPesos(item.precioUnitario)}</TableCell>
                <TableCell className="text-right font-semibold">{precioEnPesos(item.subtotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Grilla as="dl" gap="sm" className="ml-auto w-full max-w-sm print:break-inside-avoid [&>div]:flex [&>div]:justify-between [&>div]:gap-3">
          <div className="items-end border-b pb-3">
            <dt className="font-semibold">Total</dt>
            <dd className={estado === "anulada" ? "angosta pb-2 text-3xl font-bold text-muted-foreground line-through" : "subrayado-doble angosta pb-2 text-3xl font-bold text-tapa print:text-black"}>
              {precioEnPesos(factura.total)}
            </dd>
          </div>
          <div><dt className="text-muted-foreground">Forma de pago</dt><dd className="font-medium">{formasPago[pago.forma]}</dd></div>
          {pago.forma === "contado" && (
            <>
              <div><dt className="text-muted-foreground">Monto recibido</dt><dd className="font-medium">{precioEnPesos(pago.montoRecibido)}</dd></div>
              <div><dt className="text-muted-foreground">Vuelto</dt><dd className="font-medium">{precioEnPesos(pago.vuelto)}</dd></div>
            </>
          )}
          {pago.forma === "tarjeta" && (
            <div>
              <dt className="text-muted-foreground">Tarjeta</dt>
              <dd className="text-right font-medium">
                {pago.tarjeta.tipo === "debito" ? "Débito" : "Crédito"} · {pago.tarjeta.marca} · •••• {pago.tarjeta.ultimos4}
              </dd>
            </div>
          )}
          {factura.saldoCliente !== undefined && (
            <div><dt className="text-muted-foreground">Saldo al emitir</dt><dd className="font-medium">{precioEnPesos(factura.saldoCliente)}</dd></div>
          )}
        </Grilla>
      </Panel>
    </Pila>
  );
}
