import Link from "next/link";
import { redirect } from "next/navigation";
import { claseSecundaria } from "@/components/acceso/estilos";
import { ApiError } from "@/lib/api-error";
import type { listarMovimientos } from "@/services/stock";

export type ParametrosPagina = Promise<Record<string, string | string[] | undefined>>;
type Pagina = { page: number; pageSize: number; total: number };
type Filtros = Record<string, string | undefined>;

export { precioEnPesos } from "@/lib/formatos";

const cantidadConSigno = new Intl.NumberFormat("es-AR", { signDisplay: "always" });
const fechaArgentina = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

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
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? "resultado" : "resultados"} · Página {page} de {ultima}
      </p>
      {ultima > 1 && (
        <nav aria-label="Paginación" className="flex flex-wrap gap-2">
          {page > 1 && (
            <Link href={enlacePagina(ruta, filtros, page - 1)} prefetch={false} className={claseSecundaria}>
              Anterior
            </Link>
          )}
          {page < ultima && (
            <Link href={enlacePagina(ruta, filtros, page + 1)} prefetch={false} className={claseSecundaria}>
              Siguiente
            </Link>
          )}
        </nav>
      )}
    </footer>
  );
}

export function Estado({ activo, femenino = false }: { activo: boolean; femenino?: boolean }) {
  const etiqueta = activo ? (femenino ? "Activa" : "Activo") : (femenino ? "Inactiva" : "Inactivo");
  return (
    <span className={activo
      ? "inline-block rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900"
      : "inline-block rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700"}
    >
      {etiqueta}
    </span>
  );
}

export function AvisoBajoStock() {
  return (
    <span className="inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-950">
      Bajo stock
    </span>
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
    return <p className="p-5 text-muted-foreground">No hay movimientos para mostrar.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table aria-label="Movimientos de stock" className="w-full text-left text-sm">
        <thead className="border-b bg-background text-muted-foreground [&_th]:px-4 [&_th]:py-3">
          <tr>
            <th scope="col">Fecha</th>
            {mostrarProducto && <th scope="col">Producto</th>}
            <th scope="col">Tipo</th>
            <th scope="col" className="text-right">Cantidad</th>
            <th scope="col" className="text-right">Existencia resultante</th>
            <th scope="col">Motivo</th>
            <th scope="col">Observación</th>
            <th scope="col">Usuario</th>
          </tr>
        </thead>
        <tbody className="divide-y [&_td]:px-4 [&_td]:py-3">
          {movimientos.map((movimiento) => (
            <tr key={movimiento.id} className="align-top">
              <td className="whitespace-nowrap">
                <time dateTime={movimiento.fecha}>{fechaArgentina.format(new Date(movimiento.fecha))}</time>
              </td>
              {mostrarProducto && (
                <td>
                  <Link href={`/productos/${movimiento.producto.id}`} prefetch={false} className="font-medium text-primary underline">
                    {movimiento.producto.codigo}
                  </Link>
                </td>
              )}
              <td>{tiposMovimiento[movimiento.tipo]}</td>
              <td className="text-right tabular-nums">{cantidadConSigno.format(movimiento.cantidad)}</td>
              <td className="text-right tabular-nums">{movimiento.existenciaResultante}</td>
              <td>
                {movimiento.motivo}
                {movimiento.referencia && (
                  <span className="block whitespace-nowrap text-muted-foreground">
                    Factura {movimiento.referencia.numero}
                  </span>
                )}
              </td>
              <td><span className="block min-w-24 break-words">{movimiento.observacion || "—"}</span></td>
              <td>{movimiento.usuario.nombre}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
