import Link from "next/link";
import type { ReactNode } from "react";
import { CerrarSesion } from "@/components/acceso/formularios-sesion";
import { requirePageUser } from "@/lib/auth-request";

const enlace =
  "rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default async function LayoutPrivado({ children }: { children: ReactNode }) {
  const usuario = await requirePageUser();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="bg-primary px-4 py-4 text-white lg:px-5 lg:py-7">
        <Link href="/" prefetch={false} className="inline-block px-3 text-lg font-semibold tracking-tight">
          Gestión comercial
        </Link>
        <nav aria-label="Navegación principal" className="mt-3 flex flex-wrap gap-1 lg:mt-8 lg:flex-col">
          <Link href="/" prefetch={false} className={enlace}>Inicio</Link>
          <Link href="/productos" prefetch={false} className={enlace}>Productos</Link>
          <Link href="/clientes" prefetch={false} className={enlace}>Clientes</Link>
          {usuario.rol === "admin" && (
            <Link href="/usuarios" prefetch={false} className={enlace}>Usuarios</Link>
          )}
          <Link href="/perfil" prefetch={false} className={enlace}>Mi perfil</Link>
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b bg-white px-5 py-4 sm:px-8">
          <div className="min-w-0">
            <p className="font-semibold break-words">{usuario.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {usuario.rol === "admin" ? "Administrador" : "Vendedor"}
            </p>
          </div>
          <CerrarSesion />
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
