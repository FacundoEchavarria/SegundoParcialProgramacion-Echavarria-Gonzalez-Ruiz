import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { claseCampo } from "@/components/acceso/estilos";
import { GestionarUsuario, NuevoUsuario } from "@/components/acceso/formularios-usuarios";
import { Fila, Grilla, Pila, Texto } from "@/components/maquetacion";
import { CampoFiltro, EncabezadoPagina, EstadoVacio, Insignia, Panel } from "@/components/pagina";
import { Button } from "@/components/ui/button";
import { requirePageUser } from "@/lib/auth-request";
import { listadoUsuariosSchema } from "@/lib/schemas/usuarios";
import { listarUsuarios } from "@/services/usuarios";

export const metadata = { title: "Usuarios | Gestión comercial" };

function enlaceUsuarios(q: string | undefined, activo: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (activo) params.set("activo", activo);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/usuarios?${query}` : "/usuarios";
}

export default async function Usuarios({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requirePageUser();
  if (actor.rol !== "admin") redirect("/");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const activo = params.activo === "true" || params.activo === "false" ? params.activo : undefined;
  const page = typeof params.page === "string" ? params.page : undefined;
  const filtros = { q, activo, page };
  const resultado = listadoUsuariosSchema.safeParse(filtros);
  if (!resultado.success) redirect("/usuarios");

  const usuarios = await listarUsuarios(actor, filtros);
  const ultimaPagina = Math.max(1, Math.ceil(usuarios.total / usuarios.pageSize));
  if (usuarios.page > ultimaPagina) redirect(enlaceUsuarios(q, activo, ultimaPagina));

  return (
    <Grilla gap="lg">
      <EncabezadoPagina titulo="Usuarios" descripcion="Administrá las cuentas y sus permisos." acciones={<NuevoUsuario />} />

      <Panel className="overflow-hidden">
        <form action="/usuarios" method="get" className="border-b p-4 sm:p-5">
          <Fila gap="md" className="items-end">
            <div className="w-full sm:max-w-xs">
              <CampoFiltro etiqueta="Buscar por nombre o email">
                <input className={claseCampo} type="search" name="q" defaultValue={q} />
              </CampoFiltro>
            </div>
            <div className="min-w-36 grow sm:max-w-40">
              <CampoFiltro etiqueta="Estado">
                <select className={claseCampo} name="activo" defaultValue={activo ?? ""}>
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </CampoFiltro>
            </div>
            <Fila>
              <Button>Filtrar</Button>
              {(q || activo) && <Button asChild variant="ghost"><Link href="/usuarios" prefetch={false}>Limpiar</Link></Button>}
            </Fila>
          </Fila>
        </form>

        {usuarios.data.length === 0 ? (
          <EstadoVacio>No hay usuarios que coincidan con la búsqueda.</EstadoVacio>
        ) : (
          <Pila as="ul" gap="xs" aria-label="Resultados de usuarios" className="gap-0 divide-y">
            {usuarios.data.map((usuario) => (
              <Grilla
                as="li"
                key={usuario.id}
                gap="sm"
                className="grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_9rem_6rem_auto] sm:px-5"
              >
                <Fila gap="sm" className="col-span-2 min-w-0 flex-nowrap sm:col-span-1">
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-tapa-clara text-xs font-bold text-tapa uppercase">
                    {usuario.nombre.slice(0, 2)}
                  </span>
                  <Pila gap="xs" className="min-w-0 gap-0">
                    <Texto className="font-semibold break-words">{usuario.nombre}</Texto>
                    <Texto tono="secundario" className="break-all">{usuario.email}</Texto>
                  </Pila>
                </Fila>
                <Fila className="sm:contents">
                  <Insignia tono={usuario.rol === "admin" ? "info" : "neutro"}>{usuario.rol === "admin" ? "Administrador" : "Vendedor"}</Insignia>
                  <Insignia tono={usuario.activo ? "exito" : "neutro"}>{usuario.activo ? "Activo" : "Inactivo"}</Insignia>
                </Fila>
                <GestionarUsuario usuario={usuario} esPropio={usuario.id === actor.id} />
              </Grilla>
            ))}
          </Pila>
        )}

        <Fila as="footer" gap="md" className="justify-between border-t px-4 py-3 sm:px-5">
          <Texto tono="secundario">
            {usuarios.total} {usuarios.total === 1 ? "usuario" : "usuarios"} · Página {usuarios.page} de {ultimaPagina}
          </Texto>
          {ultimaPagina > 1 && (
            <Fila as="nav" aria-label="Paginación de usuarios">
              {usuarios.page > 1 && (
                <Button asChild variant="outline" size="sm">
                  <Link href={enlaceUsuarios(q, activo, usuarios.page - 1)} prefetch={false}><ChevronLeft aria-hidden />Anterior</Link>
                </Button>
              )}
              {usuarios.page < ultimaPagina && (
                <Button asChild variant="outline" size="sm">
                  <Link href={enlaceUsuarios(q, activo, usuarios.page + 1)} prefetch={false}>Siguiente<ChevronRight aria-hidden /></Link>
                </Button>
              )}
            </Fila>
          )}
        </Fila>
      </Panel>
    </Grilla>
  );
}
