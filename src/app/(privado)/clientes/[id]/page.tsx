import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EstadoVacio } from "@/components/estados";
import { Estado, Insignia } from "@/components/insignia";
import { CampoFiltro, Dato, Panel } from "@/components/pagina";
import { claseCampo } from "@/components/acceso/estilos";
import { CambiarEstadoCliente, FormularioCliente } from "@/components/clientes/formularios";
import { saldoEnPesos } from "@/components/clientes/listados";
import { FormularioPago } from "@/components/clientes/formulario-pago";
import { textoParametro, type ParametrosPagina } from "@/components/productos/listados";
import { Fila, Grilla, Pila, Texto, Titulo } from "@/components/maquetacion";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

// La cuenta corriente como en la libreta: doble margen rojo y el saldo de cierre subrayado dos veces.
function HistorialCuenta({ cuenta }: { cuenta: Cuenta }) {
  return (
    <div className="relative pl-6">
      <span aria-hidden className="absolute inset-y-0 left-3 w-[5px] border-x border-margen/70" />
      <Fila gap="md" className="justify-between border-b px-4 py-3 sm:px-5">
        <Texto tono="secundario">Saldo anterior</Texto>
        <Texto className="font-semibold">{saldoEnPesos(cuenta.saldoAnterior)}</Texto>
      </Fila>
      {cuenta.movimientos.length === 0 ? (
        <EstadoVacio>No hay movimientos en el período seleccionado.</EstadoVacio>
      ) : (
        <Table aria-label="Movimientos de cuenta corriente">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Importe</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cuenta.movimientos.map((movimiento, indice) => (
              <TableRow key={`${movimiento.fecha}-${indice}`}>
                <TableCell>
                  <time dateTime={movimiento.fecha}>{fechaArgentina.format(new Date(movimiento.fecha))}</time>
                </TableCell>
                <TableCell>
                  <Insignia tono={movimiento.tipo === "debito" ? "info" : "exito"}>{movimiento.tipo === "debito" ? "Débito" : "Crédito"}</Insignia>
                </TableCell>
                <TableCell className="min-w-36 whitespace-normal break-words">
                  {movimiento.pagoId !== null ? (
                    <Link href={`/pagos/${movimiento.pagoId}`} className="text-tapa hover:underline">{movimiento.descripcion}</Link>
                  ) : movimiento.facturaId !== null ? (
                    <Link href={`/ventas/${movimiento.facturaId}`} className="text-tapa hover:underline">{movimiento.descripcion}</Link>
                  ) : movimiento.descripcion}
                </TableCell>
                <TableCell className={movimiento.tipo === "credito" ? "text-right font-semibold text-exito" : "text-right font-semibold"}>
                  {saldoEnPesos(movimiento.importe)}
                </TableCell>
                <TableCell className="text-right">{saldoEnPesos(movimiento.saldo)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Fila as="footer" gap="md" className="items-end justify-between border-t px-4 py-4 sm:px-5">
        <Texto className="font-semibold">Saldo al cierre del período</Texto>
        <Texto as="span" className="subrayado-doble angosta pb-2 text-xl font-bold text-tapa">{saldoEnPesos(cuenta.saldo)}</Texto>
      </Fila>
    </div>
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
  ];
  const cuentaDatos = [
    ["Cuenta corriente", cliente.cuentaCorriente ? "Habilitada" : "Deshabilitada"],
    ["Límite de crédito", cliente.limiteCredito === null ? "Sin límite" : saldoEnPesos(cliente.limiteCredito)],
    ["Crédito disponible", cliente.disponible === null ? "Sin límite" : saldoEnPesos(cliente.disponible)],
  ];

  return (
    <Grilla gap="lg">
      <Pila gap="sm">
        <Button asChild variant="ghost" className="w-fit"><Link href="/clientes" prefetch={false}><ArrowLeft aria-hidden />Volver a clientes</Link></Button>
        <Fila gap="md" className="justify-between">
          <Fila gap="sm" className="min-w-0">
            <Titulo className="break-words">{cliente.nombre}</Titulo>
            <Estado activo={cliente.activo} />
          </Fila>
          <Fila>
            {cliente.activo && cliente.cuentaCorriente && cliente.saldo > 0 && (
              <FormularioPago clienteId={cliente.id} deuda={saldoEnPesos(cliente.saldo)} />
            )}
            <FormularioCliente cliente={cliente} />
            <CambiarEstadoCliente cliente={cliente} />
          </Fila>
        </Fila>
      </Pila>

      <Grilla gap="md" className="lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel className="p-5 sm:p-6">
          <Grilla as="dl" gap="lg" className="sm:grid-cols-2">
            {datos.map(([etiqueta, valor]) => <Dato key={etiqueta} etiqueta={etiqueta}>{valor}</Dato>)}
          </Grilla>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <Pila gap="md">
            <Pila gap="xs">
              <Titulo nivel={3}>{cliente.saldo < 0 ? "Saldo a favor" : "Saldo actual"}</Titulo>
              <span className={cliente.saldo > 0 ? "angosta text-3xl font-bold text-tapa" : "angosta text-3xl font-bold text-exito"}>
                {saldoEnPesos(Math.abs(cliente.saldo))}
              </span>
            </Pila>
            <Grilla as="dl" gap="sm">
              {cuentaDatos.map(([etiqueta, valor]) => (
                <Fila key={etiqueta} gap="md" className="justify-between">
                  <Texto as="dt" tono="secundario">{etiqueta}</Texto>
                  <dd className="font-semibold">{valor}</dd>
                </Fila>
              ))}
            </Grilla>
          </Pila>
        </Panel>
      </Grilla>

      <Panel className="overflow-hidden">
        <Fila as="header" className="border-b px-4 py-4 sm:px-5"><Titulo nivel={2}>Últimas facturas</Titulo></Fila>
        {cliente.ultimasFacturas.length === 0 ? (
          <EstadoVacio>Todavía no hay facturas.</EstadoVacio>
        ) : (
          <Pila as="ul" gap="xs" className="gap-0 divide-y">
            {cliente.ultimasFacturas.map((factura) => (
              <Fila as="li" key={factura.id} gap="md" className="px-4 py-3 sm:px-5">
                <Link href={`/ventas/${factura.id}`} className="font-semibold text-tapa hover:underline">{factura.numeroFormateado}</Link>
                <time dateTime={factura.fecha} className="text-sm text-muted-foreground">{fechaArgentina.format(new Date(factura.fecha))}</time>
                <Insignia tono={factura.estado === "emitida" ? "exito" : "peligro"}>{factura.estado === "emitida" ? "Emitida" : "Anulada"}</Insignia>
                <Texto as="span" className="ml-auto font-semibold">{saldoEnPesos(factura.total)}</Texto>
              </Fila>
            ))}
          </Pila>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <Fila as="header" className="border-b px-4 py-4 sm:px-5"><Titulo nivel={2}>Cuenta corriente</Titulo></Fila>
        <form action={ruta} method="get" className="border-b p-4 sm:p-5">
          <Fila gap="md" className="items-end">
            <div className="grow"><CampoFiltro etiqueta="Desde"><input className={claseCampo} type="date" name="desde" defaultValue={desde} /></CampoFiltro></div>
            <div className="grow"><CampoFiltro etiqueta="Hasta"><input className={claseCampo} type="date" name="hasta" defaultValue={hasta} /></CampoFiltro></div>
            <Fila>
              <Button>Filtrar</Button>
              {(desde || hasta) && <Button asChild variant="ghost"><Link href={ruta} prefetch={false}>Limpiar</Link></Button>}
            </Fila>
          </Fila>
        </form>
        {typeof cuenta === "string" ? (
          <Texto role="alert" tono="peligro" className="p-5 font-medium">{cuenta}</Texto>
        ) : (
          <HistorialCuenta cuenta={cuenta} />
        )}
      </Panel>
    </Grilla>
  );
}
