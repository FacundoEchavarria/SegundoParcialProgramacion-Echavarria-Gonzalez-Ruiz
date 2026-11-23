"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { House, Menu, Package, ReceiptText, UserCog, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const modulos = [
  { href: "/", nombre: "Inicio", Icono: House },
  { href: "/ventas", nombre: "Ventas", Icono: ReceiptText },
  { href: "/productos", nombre: "Productos", Icono: Package },
  { href: "/clientes", nombre: "Clientes", Icono: Users },
  { href: "/usuarios", nombre: "Usuarios", Icono: UserCog, soloAdmin: true },
  { href: "/perfil", nombre: "Mi perfil", Icono: UserRound },
];

function esActivo(ruta: string, href: string) {
  if (href === "/clientes" && ruta.startsWith("/pagos/")) return true;
  return href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);
}

function Enlaces({ esAdmin, alElegir }: { esAdmin: boolean; alElegir?: () => void }) {
  const ruta = usePathname();
  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-1">
      {modulos.filter((modulo) => esAdmin || !modulo.soloAdmin).map(({ href, nombre, Icono }) => {
        const activo = esActivo(ruta, href);
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            onClick={alElegir}
            aria-current={activo ? "page" : undefined}
            className={cn(
              // El módulo activo es la etiqueta clara de la tapa: se une con el fondo de la página.
              "flex items-center gap-3 rounded-l-lg py-2.5 pr-4 pl-3 text-sm font-medium text-tapa-texto transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white",
              activo && "bg-background font-semibold text-tapa hover:bg-background hover:text-tapa focus-visible:outline-tapa",
            )}
          >
            <Icono aria-hidden className="size-4.5 shrink-0" />
            {nombre}
          </Link>
        );
      })}
    </nav>
  );
}

function Marca() {
  return (
    <Link href="/" prefetch={false} className="angosta px-3 text-3xl font-bold tracking-tight text-white">
      Gestión comercial
    </Link>
  );
}

export function PanelLateral({ esAdmin }: { esAdmin: boolean }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-8 bg-tapa py-6 pl-4 lg:flex print:hidden">
      <Marca />
      <Enlaces esAdmin={esAdmin} />
    </aside>
  );
}

// En pantallas chicas el panel lateral se colapsa en este menú.
export function MenuMovil({ esAdmin }: { esAdmin: boolean }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-8 border-0 bg-tapa py-6 pr-0 pl-4 text-white [&>button]:text-white">
        <SheetTitle className="sr-only">Menú</SheetTitle>
        <SheetDescription className="sr-only">Módulos del sistema</SheetDescription>
        <Marca />
        <Enlaces esAdmin={esAdmin} alElegir={() => setAbierto(false)} />
      </SheetContent>
    </Sheet>
  );
}
