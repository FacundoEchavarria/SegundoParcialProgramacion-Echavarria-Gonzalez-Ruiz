import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListFilter } from "lucide-react";
import { AvisoBajoStock, Estado } from "@/components/insignia";
import { Cifra, Dato, Panel } from "@/components/pagina";
import { Fila, Grilla, Pila, Texto, Titulo } from "@/components/maquetacion";
import { CambiarEstado, FormularioMovimiento, FormularioProducto } from "@/components/productos/formularios";
import { cargarPagina, Paginacion, precioEnPesos, TablaMovimientos, textoParametro, type ParametrosPagina } from "@/components/productos/listados";
import { Button } from "@/components/ui/button";
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
    <Grilla gap="lg">
      <Pila gap="sm">
        <Button asChild variant="ghost" className="w-fit"><Link href="/productos" prefetch={false}><ArrowLeft aria-hidden />Volver a productos</Link></Button>
        <Fila gap="md" className="justify-between">
          <Pila gap="xs" className="min-w-0">
            <Fila gap="sm">
              <Titulo className="break-words">{producto.descripcion}</Titulo>
              <Estado activo={producto.activo} />
            </Fila>
            <Texto tono="secundario">Código {producto.codigo}</Texto>
          </Pila>
          {admin && (
            <Fila>
              <FormularioMovimiento productoId={producto.id} />
              <FormularioProducto producto={producto} categorias={categorias} />
              <CambiarEstado producto={producto} />
            </Fila>
          )}
        </Fila>
      </Pila>

      <Panel className="p-5 sm:p-6">
        <Grilla as="dl" gap="lg" className="grid-cols-2 sm:grid-cols-4">
          <Dato etiqueta="Categoría">{producto.categoria.nombre}</Dato>
          <Dato etiqueta="Precio"><Cifra className="text-xl">{precioEnPesos(producto.precio)}</Cifra></Dato>
          <Dato etiqueta="Existencia">
            <Fila gap="sm">
              <Cifra className={producto.bajoMinimo ? "text-xl text-alerta" : "text-xl"}>{producto.existencia}</Cifra>
              {producto.bajoMinimo && <AvisoBajoStock />}
            </Fila>
          </Dato>
          <Dato etiqueta="Stock mínimo"><Cifra className="text-xl">{producto.stockMinimo}</Cifra></Dato>
        </Grilla>
      </Panel>

      <Panel className="overflow-hidden">
        <Fila as="header" gap="md" className="justify-between border-b p-4 sm:px-5">
          <Titulo nivel={2}>Historial de stock</Titulo>
          <Button asChild variant="outline" size="sm">
            <Link href={`/productos/movimientos?productoId=${producto.id}`} prefetch={false}><ListFilter aria-hidden />Filtrar movimientos</Link>
          </Button>
        </Fila>
        <TablaMovimientos movimientos={movimientos.data} />
        <Paginacion ruta={ruta} filtros={filtros} pagina={movimientos} />
      </Panel>
    </Grilla>
  );
}
