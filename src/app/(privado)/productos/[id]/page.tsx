import Link from "next/link";
import { notFound } from "next/navigation";
import { claseSecundaria } from "@/components/acceso/estilos";
import { CambiarEstado, FormularioMovimiento, FormularioProducto } from "@/components/productos/formularios";
import {
  AvisoBajoStock,
  cargarPagina,
  Estado,
  Paginacion,
  precioEnPesos,
  TablaMovimientos,
  textoParametro,
  type ParametrosPagina,
} from "@/components/productos/listados";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-error";
import { requirePageUser } from "@/lib/auth-request";
import { listarCategorias, obtenerProducto } from "@/services/productos";
import { listarMovimientos } from "@/services/stock";

export const metadata = { title: "Ficha de producto | Gestión comercial" };

export default async function FichaProducto({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: ParametrosPagina;
}) {
  const actor = await requirePageUser();
  const admin = actor.rol === "admin";
  const { id } = await params;
  const producto = await obtenerProducto(actor, id).catch((error: unknown) => {
    if (error instanceof ApiError && (error.status === 404 || error.status === 422)) notFound();
    throw error;
  });

  const query = await searchParams;
  const ruta = `/productos/${producto.id}`;
  const filtros = { pageSize: textoParametro(query.pageSize) };
  const [movimientos, categorias] = await Promise.all([
    cargarPagina(ruta, filtros, () => listarMovimientos(actor, {
      ...filtros,
      productoId: String(producto.id),
      page: textoParametro(query.page),
    })),
    admin ? listarCategorias(actor, true) : [],
  ]);

  return (
    <section className="grid gap-6">
      <header className="grid gap-3">
        <Link href="/productos" prefetch={false} className="w-fit text-sm font-medium text-primary underline">
          Volver a productos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold break-all tracking-tight">{producto.codigo}</h1>
          <Estado activo={producto.activo} />
        </div>
        <p className="break-words text-muted-foreground">{producto.descripcion}</p>
      </header>

      <Card className="px-4 sm:px-5">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-sm text-muted-foreground">Categoría</dt>
            <dd className="mt-1 font-semibold break-words">{producto.categoria.nombre}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Precio</dt>
            <dd className="mt-1 font-semibold tabular-nums">{precioEnPesos(producto.precio)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Existencia</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2 font-semibold tabular-nums">
              {producto.existencia}
              {producto.bajoMinimo && <AvisoBajoStock />}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Stock mínimo</dt>
            <dd className="mt-1 font-semibold tabular-nums">{producto.stockMinimo}</dd>
          </div>
        </dl>
        {admin && (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <FormularioProducto producto={producto} categorias={categorias} />
            <CambiarEstado producto={producto} />
            <FormularioMovimiento productoId={producto.id} />
          </div>
        )}
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
          <h2 className="text-xl font-semibold">Historial de stock</h2>
          <Link
            href={`/productos/movimientos?productoId=${producto.id}`}
            prefetch={false}
            className={claseSecundaria}
          >
            Filtrar movimientos
          </Link>
        </header>
        <TablaMovimientos movimientos={movimientos.data} />
        <Paginacion ruta={ruta} filtros={filtros} pagina={movimientos} />
      </Card>
    </section>
  );
}
