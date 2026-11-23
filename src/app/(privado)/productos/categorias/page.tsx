import { EstadoVacio } from "@/components/estados";
import { Estado } from "@/components/insignia";
import { EncabezadoPagina, Panel } from "@/components/pagina";
import { Fila, Grilla, Pila, Titulo } from "@/components/maquetacion";
import { Pestanas, pestanasProductos } from "@/components/pestanas";
import { CambiarEstado, FormularioCategoria } from "@/components/productos/formularios";
import { requirePageUser } from "@/lib/auth-request";
import { listarCategorias } from "@/services/productos";

export const metadata = { title: "Categorías | Gestión comercial" };

export default async function Categorias() {
  const actor = await requirePageUser();
  const admin = actor.rol === "admin";
  const categorias = await listarCategorias(actor, admin);

  return (
    <Grilla gap="lg">
      <EncabezadoPagina titulo="Productos" acciones={admin && <FormularioCategoria />} />
      <Pila gap="md">
        <Pestanas etiqueta="Secciones de productos" pestanas={pestanasProductos} />
        <Panel>
          {categorias.length === 0 ? (
            <EstadoVacio>No hay categorías para mostrar.</EstadoVacio>
          ) : (
            <Pila as="ul" gap="xs" aria-label="Categorías de productos" className="gap-0 divide-y">
              {categorias.map((categoria) => (
                <Grilla
                  as="li"
                  key={categoria.id}
                  gap="sm"
                  className="grid-cols-[minmax(0,1fr)_auto] items-center px-4 py-3 sm:grid-cols-[minmax(0,1fr)_6rem_auto] sm:px-5"
                >
                  <Titulo nivel={2} className="text-sm font-semibold break-words">{categoria.nombre}</Titulo>
                  <Fila><Estado activo={categoria.activa} femenino /></Fila>
                  {admin && (
                    <Fila className="col-span-2 sm:col-span-1">
                      <FormularioCategoria categoria={categoria} />
                      <CambiarEstado categoria={categoria} />
                    </Fila>
                  )}
                </Grilla>
              ))}
            </Pila>
          )}
        </Panel>
      </Pila>
    </Grilla>
  );
}
