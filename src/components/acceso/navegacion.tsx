"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const modulos = [
  { ruta: "/", nombre: "Inicio" },
  { ruta: "/ventas", nombre: "Ventas" },
  { ruta: "/productos", nombre: "Productos" },
  { ruta: "/clientes", nombre: "Clientes" },
  { ruta: "/usuarios", nombre: "Usuarios", soloAdmin: true },
  { ruta: "/perfil", nombre: "Mi perfil" },
];

export function Navegacion({ admin }: { admin: boolean }) {
  const rutaActual = usePathname();
  const rutaModulo = rutaActual.startsWith("/pagos/") ? "/clientes" : rutaActual;
  const [abierta, setAbierta] = useState(false);
  const menu = useRef<HTMLButtonElement>(null);
  const id = useId();

  return (
    <aside className="bg-primary px-4 py-4 text-white lg:px-5 lg:py-7 print:hidden"
      onKeyDown={(evento) => {
        if (evento.key === "Escape" && abierta && menu.current?.getClientRects().length) {
          setAbierta(false);
          menu.current.focus();
        }
      }}>
      <div className="lg:sticky lg:top-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/" prefetch={false} onClick={() => setAbierta(false)}
            className="inline-block px-3 text-lg font-semibold tracking-tight">
            Gestión comercial
          </Link>
          <button ref={menu} type="button" aria-expanded={abierta} aria-controls={id}
            className="rounded-md border border-white/50 px-3 py-2 text-sm font-medium focus-visible:outline-2 lg:hidden"
            onClick={() => setAbierta(!abierta)}>
            Menú
          </button>
        </div>
        <nav id={id} aria-label="Navegación principal"
          className={cn("mt-3 flex-col gap-1 lg:mt-8 lg:flex", abierta ? "flex" : "hidden")}>
          {modulos.filter(({ soloAdmin }) => !soloAdmin || admin).map(({ ruta, nombre }) => {
            const exacta = rutaActual === ruta;
            const activa = rutaModulo === ruta || rutaModulo.startsWith(`${ruta}/`);
            return (
              <Link key={ruta} href={ruta} prefetch={false} onClick={() => setAbierta(false)}
                aria-current={exacta ? "page" : activa ? "location" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2",
                  activa && "bg-white/20 font-semibold",
                )}>
                {nombre}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
