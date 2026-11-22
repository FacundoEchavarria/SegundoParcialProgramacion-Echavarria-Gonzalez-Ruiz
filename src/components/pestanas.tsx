"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Pestañas de un módulo: cada una es una ruta propia; la activa se marca según la URL.
export function Pestanas({ etiqueta, pestanas }: { etiqueta: string; pestanas: { href: string; nombre: string }[] }) {
  const ruta = usePathname();
  return (
    <nav aria-label={etiqueta} className="-mb-px flex gap-1 overflow-x-auto border-b print:hidden">
      {pestanas.map(({ href, nombre }) => {
        const activa = ruta === href;
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-t-md border border-transparent px-4 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2",
              activa && "border-border border-b-card bg-card font-semibold text-tapa hover:text-tapa",
            )}
          >
            {nombre}
          </Link>
        );
      })}
    </nav>
  );
}

export const pestanasProductos = [
  { href: "/productos", nombre: "Catálogo" },
  { href: "/productos/movimientos", nombre: "Existencias" },
  { href: "/productos/categorias", nombre: "Categorías" },
];

export const pestanasClientes = [
  { href: "/clientes", nombre: "Listado" },
  { href: "/clientes/saldos", nombre: "Saldos" },
];
