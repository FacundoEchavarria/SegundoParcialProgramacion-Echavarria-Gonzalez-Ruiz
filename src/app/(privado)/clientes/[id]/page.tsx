import Link from "next/link";
import { notFound } from "next/navigation";
import { claseCampo, clasePrincipal, claseSecundaria } from "@/components/acceso/estilos";
import { CambiarEstadoCliente, FormularioCliente } from "@/components/clientes/formularios";
import { saldoEnPesos } from "@/components/clientes/listados";
import { FormularioPago } from "@/components/clientes/formulario-pago";
import { Estado, textoParametro, type ParametrosPagina } from "@/components/productos/listados";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-error";
import { requirePageUser } from "@/lib/auth-request";
import { obtenerCliente } from "@/services/clientes";
import { obtenerCuenta } from "@/services/cuenta-corriente";

export const metadata = { title: "Ficha de cliente | Gestión comercial" };

const fechaArgentina = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

type Cuenta = Awaited<ReturnType<typeof obtenerCuenta>>;

function HistorialCuenta({ cuenta }: { cuenta: Cuenta }) {
  return (
    <>
      <div className="flex flex-wrap justify-between gap-2 border-b p-4 text-sm sm:px-5">
        <span>Saldo anterior</span>
        <strong className="tabular-nums">{saldoEnPesos(cuenta.saldoAnterior)}</strong>
      </div>
      {cuenta.movimientos.length === 0 ? (
        <p className="p-5 text-muted-foreground">No hay movimientos en el período seleccionado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table aria-label="Movimientos de cuenta corriente" className="w-full text-left text-sm">
            <thead className="border-b bg-background text-muted-foreground [&_th]:px-4 [&_th]:py-3">
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Tipo</th>
                <th scope="col">Descripción</th>
                <th scope="col" className="text-right">Importe</th>
                <th scope="col" className="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y [&_td]:px-4 [&_td]:py-3">
              {cuenta.movimientos.map((movimiento, indice) => (
                <tr key={`${movimiento.fecha}-${indice}`}>
                  <td className="whitespace-nowrap">
                    <time dateTime={movimiento.fecha}>{fechaArgentina.format(new Date(movimiento.fecha))}</time>
                  </td>
                  <td>{movimiento.tipo === "debito" ? "Débito" : "Crédito"}</td>
                  <td className="min-w-36 break-words">
                    {movimiento.pagoId !== null ? (
                      <Link href={`/pagos/${movimiento.pagoId}`} className="text-primary underline">
                        {movimiento.descripcion}
                      </Link>
                    ) : movimiento.facturaId !== null ? (
                      <Link href={`/ventas/${movimiento.facturaId}`} className="text-primary underline">
                        {movimiento.descripcion}
                      </Link>
                    ) : movimiento.descripcion}
                  </td>
                  <td className="text-right whitespace-nowrap tabular-nums">{saldoEnPesos(movimiento.importe)}</td>
                  <td className="text-right whitespace-nowrap tabular-nums">{saldoEnPesos(movimiento.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <footer className="flex flex-wrap justify-between gap-2 border-t p-4 font-semibold sm:px-5">
        <span>Saldo al cierre del período</span>
        <span className="tabular-nums">{saldoEnPesos(cuenta.saldo)}</span>
      </footer>
    </>
  );
}

export default async function FichaCliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: ParametrosPagina;
}) {
  const actor = await requirePageUser();
  const { id } = await params;
  const cliente = await obtenerCliente(actor, id).catch((error: unknown) => {
    if (error instanceof ApiError && (error.status === 404 || error.status === 422)) notFound();
    throw error;
  });

  const ruta = `/clientes/${cliente.id}`;
  const query = await searchParams;
  const desde = textoParametro(query.desde);
  const hasta = textoParametro(query.hasta);
  const cuenta = await obtenerCuenta(actor, cliente.id, { desde, hasta }).catch((error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 404) notFound();
      if (error.status === 400 || error.status === 422) {
        const detalle = Array.isArray(error.details) ? error.details[0] : undefined;
        return detalle && "mensaje" in detalle ? detalle.mensaje : "Ingresá un período válido.";
      }
    }
    throw error;
  });
  const datos = [
    ["Documento", `${cliente.tipoDoc} ${cliente.nroDoc}`],
    ["Domicilio", cliente.domicilio ?? "—"],
    ["Teléfono", cliente.telefono ?? "—"],
    ["Email", cliente.email ?? "—"],
    ["Cuenta corriente", cliente.cuentaCorriente ? "Habilitada" : "Deshabilitada"],
    cliente.saldo < 0
      ? ["Saldo a favor", saldoEnPesos(-cliente.saldo)]
      : ["Saldo actual", saldoEnPesos(cliente.saldo)],
    ["Límite de crédito", cliente.limiteCredito === null ? "Sin límite" : saldoEnPesos(cliente.limiteCredito)],
    ["Crédito disponible", cliente.disponible === null ? "Sin límite" : saldoEnPesos(cliente.disponible)],
  ];

  return (
    <section className="grid gap-6">
      <header className="grid gap-3">
        <Link href="/clientes" prefetch={false} className="w-fit text-sm font-medium text-primary underline">
          Volver a clientes
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold break-words tracking-tight">{cliente.nombre}</h1>
          <Estado activo={cliente.activo} />
        </div>
      </header>

      <Card className="px-4 sm:px-5">
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="min-w-0">
              <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
              <dd className="mt-1 font-semibold break-words tabular-nums">{valor}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <FormularioCliente cliente={cliente} />
          <CambiarEstadoCliente cliente={cliente} />
          {cliente.activo && cliente.cuentaCorriente && cliente.saldo > 0 && (
            <FormularioPago clienteId={cliente.id} deuda={saldoEnPesos(cliente.saldo)} />
          )}
        </div>
      </Card>

      <Card className="gap-2 px-4 sm:px-5">
        <h2 className="text-xl font-semibold">Últimas facturas</h2>
        {cliente.ultimasFacturas.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay facturas.</p>
        ) : (
          <ul className="divide-y text-sm">
            {cliente.ultimasFacturas.map((factura) => (
              <li key={factura.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
                <Link href={`/ventas/${factura.id}`} className="font-medium text-primary underline tabular-nums">
                  {factura.numeroFormateado}
                </Link>
                <time dateTime={factura.fecha} className="text-muted-foreground">
                  {fechaArgentina.format(new Date(factura.fecha))}
                </time>
                <span>{factura.estado === "emitida" ? "Emitida" : "Anulada"}</span>
                <span className="ml-auto font-medium tabular-nums">{saldoEnPesos(factura.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <header className="border-b p-4 sm:p-5">
          <h2 className="text-xl font-semibold">Movimientos de cuenta corriente</h2>
        </header>
        <form action={ruta} method="get" className="flex flex-wrap items-end gap-3 border-b p-4 sm:p-5">
          <label className="grid grow gap-1.5 text-sm font-medium">
            Desde
            <input className={claseCampo} type="date" name="desde" defaultValue={desde} />
          </label>
          <label className="grid grow gap-1.5 text-sm font-medium">
            Hasta
            <input className={claseCampo} type="date" name="hasta" defaultValue={hasta} />
          </label>
          <button className={clasePrincipal}>Filtrar</button>
          {(desde || hasta) && <Link href={ruta} prefetch={false} className={claseSecundaria}>Limpiar</Link>}
        </form>
        {typeof cuenta === "string" ? (
          <p role="alert" className="p-5 text-red-800">{cuenta}</p>
        ) : (
          <HistorialCuenta cuenta={cuenta} />
        )}
      </Card>
    </section>
  );
}
