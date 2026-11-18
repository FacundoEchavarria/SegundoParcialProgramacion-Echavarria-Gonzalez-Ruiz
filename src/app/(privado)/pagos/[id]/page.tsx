import Link from "next/link";
import { notFound } from "next/navigation";
import { claseSecundaria } from "@/components/acceso/estilos";
import { BotonImprimir } from "@/components/clientes/boton-imprimir";
import { saldoEnPesos } from "@/components/clientes/listados";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-error";
import { requirePageUser } from "@/lib/auth-request";
import { mediosPago } from "@/lib/schemas/pagos";
import { obtenerPago } from "@/services/pagos";

export const metadata = { title: "Recibo de pago | Gestión comercial" };

const fechaArgentina = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function ReciboPago({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePageUser();
  const { id } = await params;
  const { recibo, observacion } = await obtenerPago(actor, id).catch((error: unknown) => {
    if (error instanceof ApiError && (error.status === 404 || error.status === 422)) notFound();
    throw error;
  });

  const datos = [
    ["Fecha", fechaArgentina.format(new Date(recibo.fecha))],
    ["Cliente", recibo.cliente.nombre],
    ["Recibido por", recibo.usuario.nombre],
    ["Medio de pago", mediosPago[recibo.medio]],
    ["Saldo después del pago", saldoEnPesos(recibo.saldoCliente)],
  ];

  return (
    <section className="mx-auto grid max-w-lg gap-4 print:max-w-none">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Link className={claseSecundaria} href={`/clientes/${recibo.cliente.id}`} prefetch={false}>
          Volver a la ficha
        </Link>
        <BotonImprimir />
      </div>
      <Card className="gap-5 px-5 print:shadow-none">
        <header className="border-b pb-4">
          <p className="text-sm text-muted-foreground">Recibo de pago</p>
          <h1 className="text-2xl font-semibold tabular-nums">{recibo.numeroRecibo}</h1>
        </header>
        <dl className="grid gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Importe recibido</dt>
            <dd className="text-3xl font-semibold tabular-nums">{saldoEnPesos(recibo.importe)}</dd>
          </div>
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
              <dd className="break-words font-medium">{valor}</dd>
            </div>
          ))}
          {observacion && (
            <div>
              <dt className="text-sm text-muted-foreground">Observación</dt>
              <dd className="break-words">{observacion}</dd>
            </div>
          )}
        </dl>
      </Card>
    </section>
  );
}
