import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EstadoVacio } from "@/components/estados";
import { Insignia } from "@/components/insignia";
import { Fila, Texto } from "@/components/maquetacion";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaHora } from "@/lib/formatos";
import { ApiError } from "@/lib/api-error";
import type { listarMovimientos } from "@/services/stock";

export type ParametrosPagina = Promise<Record<string, string | string[] | undefined>>;
type Pagina = { page: number; pageSize: number; total: number };
type Filtros = Record<string, string | undefined>;

export { precioEnPesos } from "@/lib/formatos";

const cantidadConSigno = new Intl.NumberFormat("es-AR", { signDisplay: "always" });
export const tiposMovimiento = {
  ingreso: "Ingreso",
  egreso: "Egreso",
  venta: "Venta",
  anulacion: "Anulación",
};

export function textoParametro(valor: string | string[] | undefined) {
  return typeof valor === "string" && valor !== "" ? valor : undefined;
}

function enlacePagina(ruta: string, filtros: Filtros, pagina: number) {
  const params = new URLSearchParams();
  for (const [nombre, valor] of Object.entries(filtros)) {
    if (valor !== undefined) params.set(nombre, valor);
  }
  if (pagina > 1) params.set("page", String(pagina));
  const query = params.toString();
  return query ? `${ruta}?${query}` : ruta;
}

export async function cargarPagina<T extends Pagina>(
  ruta: string,
  filtros: Filtros,
  consultar: () => Promise<T>,
) {
  let pagina;
  try {
    pagina = await consultar();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 400 || error.status === 422)) {
      redirect(ruta);
    }
    throw error;
  }
  const ultima = Math.max(1, Math.ceil(pagina.total / pagina.pageSize));
  if (pagina.page > ultima) redirect(enlacePagina(ruta, filtros, ultima));
  return pagina;
}

export function Paginacion({ ruta, filtros, pagina }: { ruta: string; filtros: Filtros; pagina: Pagina }) {
  const { page, total, pageSize } = pagina;
  const ultima = Math.max(1, Math.ceil(total / pageSize));
  return (
    <Fila as="footer" gap="md" className="justify-between border-t px-4 py-3 sm:px-5">
      <Texto tono="secundario">
        {total} {total === 1 ? "resultado" : "resultados"} · Página {page} de {ultima}
      </Texto>
      {ultima > 1 && (
        <Fila as="nav" aria-label="Paginación">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={enlacePagina(ruta, filtros, page - 1)} prefetch={false}><ChevronLeft aria-hidden />Anterior</Link>
            </Button>
          )}
          {page < ultima && (
            <Button asChild variant="outline" size="sm">
              <Link href={enlacePagina(ruta, filtros, page + 1)} prefetch={false}>Siguiente<ChevronRight aria-hidden /></Link>
            </Button>
          )}
        </Fila>
      )}
    </Fila>
  );
}

export function TablaMovimientos({
  movimientos,
  mostrarProducto = false,
}: {
  movimientos: Awaited<ReturnType<typeof listarMovimientos>>["data"];
  mostrarProducto?: boolean;
}) {
  if (movimientos.length === 0) {
    return <EstadoVacio>No hay movimientos para mostrar.</EstadoVacio>;
  }
  return (
    <Table aria-label="Movimientos de stock">
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          {mostrarProducto && <TableHead>Producto</TableHead>}
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Cantidad</TableHead>
          <TableHead className="text-right">Existencia resultante</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Observación</TableHead>
          <TableHead>Usuario</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movimientos.map((movimiento) => (
          <TableRow key={movimiento.id} className="align-top">
            <TableCell>
              <time dateTime={movimiento.fecha}>{formatearFechaHora(movimiento.fecha)}</time>
            </TableCell>
            {mostrarProducto && (
              <TableCell>
                <Link href={`/productos/${movimiento.producto.id}`} prefetch={false} className="font-semibold text-tapa hover:underline">
                  {movimiento.producto.codigo}
                </Link>
              </TableCell>
            )}
            <TableCell>
              <Insignia tono={movimiento.cantidad > 0 ? "exito" : "info"}>{tiposMovimiento[movimiento.tipo]}</Insignia>
            </TableCell>
            <TableCell className={movimiento.cantidad > 0 ? "text-right font-semibold text-exito" : "text-right font-semibold"}>
              {cantidadConSigno.format(movimiento.cantidad)}
            </TableCell>
            <TableCell className="text-right">{movimiento.existenciaResultante}</TableCell>
            <TableCell className="whitespace-normal">
              {movimiento.motivo}
              {movimiento.referencia && (
                <Link href={`/ventas/${movimiento.referencia.facturaId}`} className="block whitespace-nowrap text-tapa hover:underline">
                  Factura {movimiento.referencia.numero}
                </Link>
              )}
            </TableCell>
            <TableCell className="min-w-24 whitespace-normal break-words">{movimiento.observacion || "—"}</TableCell>
            <TableCell>{movimiento.usuario.nombre}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
