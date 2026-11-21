import type { ReactNode } from "react";
import { Avisos } from "@/components/acceso/avisos";
import { CerrarSesion } from "@/components/acceso/formularios-sesion";
import { Navegacion } from "@/components/acceso/navegacion";
import { requirePageUser } from "@/lib/auth-request";

export default async function LayoutPrivado({ children }: { children: ReactNode }) {
  const usuario = await requirePageUser();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] print:block print:min-h-0">
      <Navegacion admin={usuario.rol === "admin"} />
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b bg-white px-5 py-4 sm:px-8 print:hidden">
          <div className="min-w-0">
            <p className="font-semibold break-words">{usuario.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {usuario.rol === "admin" ? "Administrador" : "Vendedor"}
            </p>
          </div>
          <CerrarSesion />
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10 print:p-0"><Avisos>{children}</Avisos></main>
      </div>
    </div>
  );
}
