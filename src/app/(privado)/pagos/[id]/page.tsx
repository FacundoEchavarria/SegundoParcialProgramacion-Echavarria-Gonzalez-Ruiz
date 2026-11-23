import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Cifra, Dato, Panel } from "@/components/pagina";
import { BotonImprimir } from "@/components/clientes/boton-imprimir";
import { saldoEnPesos } from "@/components/clientes/listados";
import { Fila, Grilla, Pila, Texto, Titulo } from "@/components/maquetacion";
import { Button } from "@/components/ui/button";
import { formatearFechaHora } from "@/lib/formatos";
import { ApiError } from "@/lib/api-error";
import { requirePageUser } from "@/lib/auth-request";
import { mediosPago } from "@/lib/schemas/pagos";
import { obtenerPago } from "@/services/pagos";

export const metadata = { title: "Recibo de pago | Gestión comercial" };

export default async function ReciboPago({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePageUser();
  const { id } = await params;
  const { recibo, observacion } = await obtenerPago(actor, id).catch((error: unknown) => {
    if (error instanceof ApiError && (error.status === 404 || error.status === 422)) notFound();
    throw error;
  });

  const datos = [
    ["Fecha", formatearFechaHora(recibo.fecha)],
    ["Cliente", recibo.cliente.nombre],
    ["Recibido por", recibo.usuario.nombre],
    ["Medio de pago", mediosPago[recibo.medio]],
    ["Saldo después del pago", saldoEnPesos(recibo.saldoCliente)],
  ];

  return (
    <Pila gap="md" className="mx-auto max-w-lg print:max-w-none">
      <Fila className="justify-between print:hidden">
        <Button asChild variant="ghost">
          <Link href={`/clientes/${recibo.cliente.id}`} prefetch={false}><ArrowLeft aria-hidden />Volver a la ficha</Link>
        </Button>
        <BotonImprimir />
      </Fila>
      <Panel className="grid gap-6 p-6 sm:p-8 print:border-0 print:p-0">
        <Pila as="header" gap="xs" className="border-b pb-5">
          <Titulo nivel={3}>Recibo de pago</Titulo>
          <Titulo>{recibo.numeroRecibo}</Titulo>
        </Pila>
        <Pila gap="xs">
          <Texto tono="secundario">Importe recibido</Texto>
          <Cifra className="subrayado-doble w-fit pb-2 text-3xl text-tapa print:text-black">{saldoEnPesos(recibo.importe)}</Cifra>
        </Pila>
        <Grilla as="dl" gap="md" className="sm:grid-cols-2">
          {datos.map(([etiqueta, valor]) => <Dato key={etiqueta} etiqueta={etiqueta}>{valor}</Dato>)}
          {observacion && <Dato etiqueta="Observación" className="sm:col-span-2">{observacion}</Dato>}
        </Grilla>
      </Panel>
    </Pila>
  );
}
