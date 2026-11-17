import Link from "next/link";
import { redirect } from "next/navigation";
import { claseCampo, clasePrincipal, claseSecundaria } from "@/components/acceso/estilos";
import { GestionarUsuario, NuevoUsuario } from "@/components/acceso/formularios-usuarios";
import { Card } from "@/components/ui/card";
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
    <section className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Usuarios</h1>
          <p className="mt-2 text-muted-foreground">Administrá las cuentas y sus permisos.</p>
        </div>
        <NuevoUsuario />
      </header>

      <Card className="gap-0 overflow-hidden py-0">
        <form
          action="/usuarios"
          method="get"
          className="flex flex-wrap items-end gap-3 border-b p-4 sm:p-5"
        >
          <label className="grid w-full gap-1.5 text-sm font-medium sm:max-w-xs">
            Buscar por nombre o email
            <input className={claseCampo} type="search" name="q" defaultValue={q} />
          </label>
          <label className="grid min-w-36 grow gap-1.5 text-sm font-medium sm:max-w-40">
            Estado
            <select className={claseCampo} name="activo" defaultValue={activo ?? ""}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </label>
          <button className={clasePrincipal}>Filtrar</button>
          {(q || activo) && (
            <Link href="/usuarios" prefetch={false} className={claseSecundaria}>Limpiar</Link>
          )}
        </form>

        {usuarios.data.length === 0 ? (
          <p className="p-5 text-muted-foreground">No hay usuarios que coincidan con la búsqueda.</p>
        ) : (
          <ul aria-label="Resultados de usuarios" className="divide-y">
            {usuarios.data.map((usuario) => (
              <li
                key={usuario.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-4
                  sm:grid-cols-[minmax(0,1fr)_8rem_5rem_auto] sm:px-5"
              >
                <div className="col-span-2 min-w-0 sm:col-span-1">
                  <p className="font-semibold break-words">{usuario.nombre}</p>
                  <p className="text-sm break-all text-muted-foreground">{usuario.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:contents">
                  <span className="text-sm text-muted-foreground">
                    {usuario.rol === "admin" ? "Administrador" : "Vendedor"}
                  </span>
                  <span className={usuario.activo
                    ? "w-fit rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900"
                    : "w-fit rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700"}
                  >
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <GestionarUsuario usuario={usuario} esPropio={usuario.id === actor.id} />
              </li>
            ))}
          </ul>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">
            {usuarios.total} {usuarios.total === 1 ? "usuario" : "usuarios"} · Página {usuarios.page} de {ultimaPagina}
          </p>
          {ultimaPagina > 1 && (
            <nav aria-label="Paginación de usuarios" className="flex flex-wrap gap-2">
              {usuarios.page > 1 && (
                <Link href={enlaceUsuarios(q, activo, usuarios.page - 1)} prefetch={false} className={claseSecundaria}>
                  Anterior
                </Link>
              )}
              {usuarios.page < ultimaPagina && (
                <Link href={enlaceUsuarios(q, activo, usuarios.page + 1)} prefetch={false} className={claseSecundaria}>
                  Siguiente
                </Link>
              )}
            </nav>
          )}
        </footer>
      </Card>
    </section>
  );
}
