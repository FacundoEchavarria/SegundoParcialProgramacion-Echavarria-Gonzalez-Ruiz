import Link from "next/link";
import { claseCampo, clasePrincipal, claseSecundaria } from "@/components/acceso/estilos";
import { FormularioProducto } from "@/components/productos/formularios";
import {
  AvisoBajoStock,
  cargarPagina,
  Estado,
  Paginacion,
  precioEnPesos,
  textoParametro,
  type ParametrosPagina,
} from "@/components/productos/listados";
import { Card } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth-request";
import { listarCategorias, listarProductos } from "@/services/productos";

export const metadata = { title: "Productos | Gestión comercial" };

export default async function Productos({ searchParams }: { searchParams: ParametrosPagina }) {
  const actor = await requirePageUser();
  const admin = actor.rol === "admin";
  const params = await searchParams;
  const filtros = {
    q: textoParametro(params.q),
    categoriaId: textoParametro(params.categoriaId),
    bajoMinimo: textoParametro(params.bajoMinimo),
    activo: admin ? textoParametro(params.activo) : undefined,
    pageSize: textoParametro(params.pageSize),
  };
  const [productos, categorias] = await Promise.all([
    cargarPagina("/productos", filtros, () => listarProductos(actor, {
      ...filtros,
      page: textoParametro(params.page),
    })),
    listarCategorias(actor, admin),
  ]);

  return (
    <section className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Productos</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/productos/categorias" prefetch={false} className={claseSecundaria}>Categorías</Link>
          <Link href="/productos/movimientos" prefetch={false} className={claseSecundaria}>Movimientos de stock</Link>
          {admin && <FormularioProducto categorias={categorias} />}
        </div>
      </header>

      <Card className="gap-0 overflow-hidden py-0">
        <form action="/productos" method="get" className="flex flex-wrap items-end gap-3 border-b p-4 sm:p-5">
          <label className="grid min-w-48 grow gap-1.5 text-sm font-medium">
            Código o descripción
            <input className={claseCampo} type="search" name="q" defaultValue={filtros.q} maxLength={100} />
          </label>
          <label className="grid min-w-36 grow gap-1.5 text-sm font-medium">
            Categoría
            <select className={claseCampo} name="categoriaId" defaultValue={filtros.categoriaId ?? ""}>
              <option value="">Todas</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}{categoria.activa ? "" : " (inactiva)"}
                </option>
              ))}
            </select>
          </label>
          {admin && (
            <label className="grid min-w-28 gap-1.5 text-sm font-medium">
              Estado
              <select className={claseCampo} name="activo" defaultValue={filtros.activo ?? "true"}>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
                <option value="todos">Todos</option>
              </select>
            </label>
          )}
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              name="bajoMinimo"
              value="true"
              defaultChecked={filtros.bajoMinimo === "true"}
            />
            Bajo stock
          </label>
          <button className={clasePrincipal}>Filtrar</button>
          {Object.values(filtros).some((valor) => valor !== undefined) && (
            <Link href="/productos" prefetch={false} className={claseSecundaria}>Limpiar</Link>
          )}
        </form>

        {productos.data.length === 0 ? (
          <p className="p-5 text-muted-foreground">No hay productos que coincidan con la búsqueda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table aria-label="Catálogo de productos" className="w-full text-left text-sm">
              <thead className="border-b bg-background text-muted-foreground [&_th]:px-4 [&_th]:py-3">
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Descripción</th>
                  <th scope="col">Categoría</th>
                  <th scope="col" className="text-right">Precio</th>
                  <th scope="col" className="text-right">Existencia</th>
                  <th scope="col" className="text-right">Mínimo</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y [&_td]:px-4 [&_td]:py-3">
                {productos.data.map((producto) => (
                  <tr key={producto.id} className="align-top">
                    <td>
                      <Link
                        href={`/productos/${producto.id}`}
                        prefetch={false}
                        className="font-semibold break-all text-primary underline"
                      >
                        {producto.codigo}
                      </Link>
                    </td>
                    <td><span className="block min-w-32 break-words">{producto.descripcion}</span></td>
                    <td>{producto.categoria.nombre}</td>
                    <td className="text-right whitespace-nowrap tabular-nums">{precioEnPesos(producto.precio)}</td>
                    <td className="text-right tabular-nums">
                      <p>{producto.existencia}</p>
                      {producto.bajoMinimo && <AvisoBajoStock />}
                    </td>
                    <td className="text-right tabular-nums">{producto.stockMinimo}</td>
                    <td><Estado activo={producto.activo} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion ruta="/productos" filtros={filtros} pagina={productos} />
      </Card>
    </section>
  );
}
