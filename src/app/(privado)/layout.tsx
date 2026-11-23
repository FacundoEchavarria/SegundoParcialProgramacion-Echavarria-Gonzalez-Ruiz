import type { ReactNode } from "react";
import { Avisos } from "@/components/acceso/avisos";
import { CerrarSesion } from "@/components/acceso/formularios-sesion";
import { Fila, Grilla, Pila, Texto } from "@/components/maquetacion";
import { MenuMovil, PanelLateral } from "@/components/navegacion";
import { requirePageUser } from "@/lib/auth-request";

export default async function LayoutPrivado({ children }: { children: ReactNode }) {
  const usuario = await requirePageUser();
  const esAdmin = usuario.rol === "admin";

  return (
    <Grilla gap="xs" className="block min-h-dvh gap-0 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] print:block print:min-h-0">
      <PanelLateral esAdmin={esAdmin} />
      <Pila gap="xs" className="gap-0">
        <Fila as="header" gap="md" className="sticky top-0 z-30 h-16 justify-between border-b bg-card px-4 sm:px-8 print:hidden">
          <Fila gap="sm" className="min-w-0">
            <MenuMovil esAdmin={esAdmin} />
            <Pila gap="xs" className="min-w-0 gap-0">
              <Texto className="truncate font-semibold">{usuario.nombre}</Texto>
              <Texto as="span" tono="secundario" className="text-xs">{esAdmin ? "Administrador" : "Vendedor"}</Texto>
            </Pila>
          </Fila>
          <CerrarSesion />
        </Fila>
        <Pila as="main" gap="xs" className="mx-auto block w-full max-w-7xl gap-0 px-4 py-6 sm:px-8 sm:py-8 print:p-0">
          <Avisos>{children}</Avisos>
        </Pila>
      </Pila>
    </Grilla>
  );
}
