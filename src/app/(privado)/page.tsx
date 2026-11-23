import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { EstadoVacio } from "@/components/estados";
import { Desplegable, EncabezadoPagina, Fecha, Panel } from "@/components/pagina";
import { Fila, Grilla, Pila, Texto, Titulo } from "@/components/maquetacion";
import { GraficoFormasDePago, GraficoVentasDiarias } from "@/components/tablero/graficos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePageUser } from "@/lib/auth-request";
import { formatearDia, precioEnPesos } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import { obtenerTablero } from "@/services/tablero";

export const metadata = { title: "Inicio | Gestión comercial" };

// Un renglón de la tira de indicadores: etiqueta, cifra y su detalle.
function Indicador({ etiqueta, valor, children, destacado = false }: {
  etiqueta: string;
  valor: string;
  children: ReactNode;
  destacado?: boolean;
}) {
  return (
    <Pila gap="xs" className="min-w-0 px-5 py-5">
      <Titulo as="dt" nivel={3}>{etiqueta}</Titulo>
      <Texto as="dd" className={cn("angosta w-fit text-3xl font-bold break-words", destacado && "subrayado-doble pb-2 text-tapa")}>{valor}</Texto>
      <Texto as="dd" tono="secundario">{children}</Texto>
    </Pila>
  );
}

export default async function Inicio() {
  await requirePageUser();
  const { hoy, mes, cuentasCorrientes, bajoMinimo, ventasDiarias, porFormaDePago, masVendidos } = await obtenerTablero();

  return (
    <Grilla gap="lg">
      <EncabezadoPagina titulo="Tablero de inicio" />

      <Panel>
        <Grilla as="dl" gap="xs" aria-label="Indicadores comerciales" className="gap-0 divide-y sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x [&>*]:border-border sm:[&>*:nth-child(-n+2)]:border-b xl:[&>*:nth-child(-n+2)]:border-b-0">
          <Indicador etiqueta="Ventas de hoy" valor={precioEnPesos(hoy.importe)} destacado>
            {hoy.cantidad} {hoy.cantidad === 1 ? "factura" : "facturas"}
          </Indicador>
          <Indicador etiqueta="Ventas del mes" valor={precioEnPesos(mes.importe)}>
            {mes.cantidad} {mes.cantidad === 1 ? "factura" : "facturas"} · Ticket promedio {precioEnPesos(mes.ticketPromedio)}
          </Indicador>
          <Indicador etiqueta="Adeudado en cuenta corriente" valor={precioEnPesos(cuentasCorrientes.totalAdeudado)}>
            {cuentasCorrientes.clientesConSaldo} {cuentasCorrientes.clientesConSaldo === 1 ? "cliente" : "clientes"} con saldo
          </Indicador>
          <Indicador etiqueta="Productos bajo el mínimo" valor={String(bajoMinimo.cantidad)}>
            <Link href="/productos?bajoMinimo=true" prefetch={false} className="inline-flex items-center gap-1 font-medium text-tapa hover:underline">
              Ver productos bajo el mínimo<ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </Indicador>
        </Grilla>
      </Panel>

      <Grilla gap="md" className="xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel className="grid min-w-0 content-start gap-4 p-5">
          <Pila gap="xs">
            <Titulo nivel={2}>Ventas diarias</Titulo>
            <Texto tono="secundario">Últimos 30 días</Texto>
          </Pila>
          <GraficoVentasDiarias ventasDiarias={ventasDiarias} />
          <Desplegable resumen="Ver importes por día" className="text-sm">
            <Table className="mt-2" aria-label="Importes de venta por día">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventasDiarias.map(({ fecha, importe }) => (
                  <TableRow key={fecha}>
                    <TableCell><Fecha iso={fecha}>{formatearDia(fecha)}</Fecha></TableCell>
                    <TableCell className="text-right">{precioEnPesos(importe)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Desplegable>
        </Panel>
        <Panel className="grid min-w-0 content-start gap-4 p-5">
          <Pila gap="xs">
            <Titulo nivel={2}>Ventas por forma de pago</Titulo>
            <Texto tono="secundario">Mes en curso</Texto>
          </Pila>
          <GraficoFormasDePago porFormaDePago={porFormaDePago} />
        </Panel>
      </Grilla>

      <Panel className="overflow-hidden">
        <Fila as="header" className="border-b px-5 py-4"><Titulo nivel={2}>Productos más vendidos del mes</Titulo></Fila>
        {masVendidos.length === 0 ? (
          <EstadoVacio>Todavía no hay productos vendidos este mes.</EstadoVacio>
        ) : (
          <Table aria-label="Productos más vendidos del mes">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-right">N.º</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead className="text-right">Importe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {masVendidos.map(({ productoId, codigo, descripcion, unidades, importe }, indice) => (
                <TableRow key={productoId}>
                  <TableCell className="angosta text-right text-xl font-bold text-tinta-400">{indice + 1}</TableCell>
                  <TableCell className="min-w-28 whitespace-normal break-words">
                    <Link href={`/productos/${productoId}`} prefetch={false} className="font-semibold text-tapa hover:underline">
                      {descripcion}
                    </Link>
                    <Texto tono="secundario" className="text-xs">{codigo}</Texto>
                  </TableCell>
                  <TableCell className="text-right">{unidades}</TableCell>
                  <TableCell className="text-right font-semibold">{precioEnPesos(importe)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </Grilla>
  );
}
