import Link from "next/link";
import { EstadoVacio } from "@/components/estados";
import { AvisoBajoStock, Estado } from "@/components/insignia";
import { CampoFiltro, EncabezadoPagina, Panel } from "@/components/pagina";
import { claseCampo } from "@/components/acceso/estilos";
import { Fila, Grilla, Pila, Texto } from "@/components/maquetacion";
import { Pestanas, pestanasProductos } from "@/components/pestanas";
import { FormularioProducto } from "@/components/productos/formularios";
import { cargarPagina, Paginacion, precioEnPesos, textoParametro, type ParametrosPagina } from "@/components/productos/listados";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <Grilla gap="lg">
      <EncabezadoPagina titulo="Productos" acciones={admin && <FormularioProducto categorias={categorias} />} />

      <Pila gap="md">
        <Pestanas etiqueta="Secciones de productos" pestanas={pestanasProductos} />
        <Panel className="overflow-hidden">
          <form action="/productos" method="get" className="border-b p-4 sm:p-5">
            <Fila gap="md" className="items-end">
              <div className="min-w-48 grow">
                <CampoFiltro etiqueta="Código o descripción">
                  <input className={claseCampo} type="search" name="q" defaultValue={filtros.q} maxLength={100} />
                </CampoFiltro>
              </div>
              <div className="min-w-36 grow">
                <CampoFiltro etiqueta="Categoría">
                  <select className={claseCampo} name="categoriaId" defaultValue={filtros.categoriaId ?? ""}>
                    <option value="">Todas</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}{categoria.activa ? "" : " (inactiva)"}
                      </option>
                    ))}
                  </select>
                </CampoFiltro>
              </div>
              {admin && (
                <div className="min-w-28">
                  <CampoFiltro etiqueta="Estado">
                    <select className={claseCampo} name="activo" defaultValue={filtros.activo ?? "true"}>
                      <option value="true">Activos</option>
                      <option value="false">Inactivos</option>
                      <option value="todos">Todos</option>
                    </select>
                  </CampoFiltro>
                </div>
              )}
              <Label className="min-h-10">
                <input
                  type="checkbox"
                  className="size-4 accent-tapa"
                  name="bajoMinimo"
                  value="true"
                  defaultChecked={filtros.bajoMinimo === "true"}
                />
                Solo bajo stock
              </Label>
              <Fila>
                <Button>Filtrar</Button>
                {Object.values(filtros).some((valor) => valor !== undefined) && (
                  <Button asChild variant="ghost"><Link href="/productos" prefetch={false}>Limpiar filtros</Link></Button>
                )}
              </Fila>
            </Fila>
          </form>

          {productos.data.length === 0 ? (
            <EstadoVacio>No hay productos que coincidan con la búsqueda.</EstadoVacio>
          ) : (
            <Table aria-label="Catálogo de productos">
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Existencia</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.data.map((producto) => (
                  <TableRow key={producto.id} className={producto.activo ? undefined : "text-muted-foreground"}>
                    <TableCell>
                      <Link href={`/productos/${producto.id}`} prefetch={false} className="font-semibold break-all text-tapa hover:underline">
                        {producto.codigo}
                      </Link>
                    </TableCell>
                    <TableCell className="min-w-32 whitespace-normal break-words">{producto.descripcion}</TableCell>
                    <TableCell>{producto.categoria.nombre}</TableCell>
                    <TableCell className="text-right font-semibold">{precioEnPesos(producto.precio)}</TableCell>
                    <TableCell className="text-right">
                      <Fila gap="sm" className="flex-nowrap justify-end">
                        {producto.bajoMinimo && <AvisoBajoStock />}
                        {/* Ancho fijo para la cifra: así las alertas quedan en columna. */}
                        <Texto as="span" className={producto.bajoMinimo ? "w-12 text-right font-semibold text-alerta" : "w-12 text-right"}>{producto.existencia}</Texto>
                      </Fila>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{producto.stockMinimo}</TableCell>
                    <TableCell><Estado activo={producto.activo} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Paginacion ruta="/productos" filtros={filtros} pagina={productos} />
        </Panel>
      </Pila>
    </Grilla>
  );
}
