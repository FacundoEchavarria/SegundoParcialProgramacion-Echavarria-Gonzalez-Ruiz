import type { ReactNode } from "react";
import { CerrarSesion } from "@/components/acceso/formularios-sesion";
import { Fila, Pila, Texto } from "@/components/maquetacion";
import { MenuMovil, PanelLateral } from "@/components/navegacion";
import { requirePageUser } from "@/lib/auth-request";

export default async function LayoutPrivado({ children }: { children: ReactNode }) {
  const usuario = await requirePageUser();
  const esAdmin = usuario.rol === "admin";

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] print:block print:min-h-0">
      <PanelLateral esAdmin={esAdmin} />
      <div className="min-w-0">
        <Fila as="header" gap="md" className="sticky top-0 z-30 h-16 justify-between border-b bg-card/95 px-4 backdrop-blur-sm sm:px-8 print:hidden">
          <Fila gap="sm" className="min-w-0">
            <MenuMovil esAdmin={esAdmin} />
            <Pila gap="xs" className="min-w-0 gap-0">
              <Texto className="truncate font-semibold">{usuario.nombre}</Texto>
              <Texto as="span" tono="secundario" className="text-xs">{esAdmin ? "Administrador" : "Vendedor"}</Texto>
            </Pila>
          </Fila>
          <CerrarSesion />
        </Fila>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
