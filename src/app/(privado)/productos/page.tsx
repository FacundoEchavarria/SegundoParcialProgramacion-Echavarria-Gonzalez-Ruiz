import Link from "next/link";
import { EstadoVacio } from "@/components/estados";
import { AvisoBajoStock, Estado } from "@/components/insignia";
import { CampoFiltro, CasillaFiltro, EncabezadoPagina, EntradaFiltro, FormularioFiltros, Panel, SelectorFiltro } from "@/components/pagina";
import { Fila, Grilla, Pila, Texto } from "@/components/maquetacion";
import { Pestanas, pestanasProductos } from "@/components/pestanas";
import { FormularioProducto } from "@/components/productos/formularios";
import { cargarPagina, Paginacion, precioEnPesos, textoParametro, type ParametrosPagina } from "@/components/productos/listados";
import { Button } from "@/components/ui/button";
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
          <FormularioFiltros action="/productos">
            <Fila gap="md" className="items-end">
              <CampoFiltro etiqueta="Código o descripción" className="min-w-48 grow">
                <EntradaFiltro type="search" name="q" defaultValue={filtros.q} maxLength={100} />
              </CampoFiltro>
              <CampoFiltro etiqueta="Categoría" className="min-w-36 grow">
                <SelectorFiltro name="categoriaId" defaultValue={filtros.categoriaId ?? ""} vacio="Todas"
                  opciones={categorias.map(({ id, nombre, activa }) => [id, activa ? nombre : `${nombre} (inactiva)`])} />
              </CampoFiltro>
              {admin && (
                <CampoFiltro etiqueta="Estado" className="min-w-28">
                  <SelectorFiltro name="activo" defaultValue={filtros.activo ?? "true"}
                    opciones={[["true", "Activos"], ["false", "Inactivos"], ["todos", "Todos"]]} />
                </CampoFiltro>
              )}
              <CasillaFiltro etiqueta="Solo bajo stock" name="bajoMinimo" value="true" defaultChecked={filtros.bajoMinimo === "true"} />
              <Fila>
                <Button>Filtrar</Button>
                {Object.values(filtros).some((valor) => valor !== undefined) && (
                  <Button asChild variant="ghost"><Link href="/productos" prefetch={false}>Limpiar filtros</Link></Button>
                )}
              </Fila>
            </Fila>
          </FormularioFiltros>

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
