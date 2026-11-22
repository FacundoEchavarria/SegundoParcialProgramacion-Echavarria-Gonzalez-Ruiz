import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Primitivas de maquetación: las páginas se arman con estas piezas en lugar de etiquetas sueltas.
type Base = { as?: ElementType; className?: string; children?: ReactNode } & Omit<ComponentProps<"div">, "className" | "children">;

const espacios = { xs: "gap-1", sm: "gap-2", md: "gap-4", lg: "gap-6", xl: "gap-8" };
type Espacio = keyof typeof espacios;

export function Pila({ as: Etiqueta = "div", gap = "md", className, ...props }: Base & { gap?: Espacio }) {
  return <Etiqueta className={cn("flex flex-col", espacios[gap], className)} {...props} />;
}

export function Fila({ as: Etiqueta = "div", gap = "sm", className, ...props }: Base & { gap?: Espacio }) {
  return <Etiqueta className={cn("flex flex-wrap items-center", espacios[gap], className)} {...props} />;
}

export function Grilla({ as: Etiqueta = "div", gap = "md", className, ...props }: Base & { gap?: Espacio }) {
  return <Etiqueta className={cn("grid", espacios[gap], className)} {...props} />;
}

const tonos = {
  normal: "text-foreground",
  secundario: "text-muted-foreground",
  peligro: "text-peligro",
  exito: "text-exito",
};

export function Texto({ as: Etiqueta = "p", tono = "normal", className, ...props }: Base & { tono?: keyof typeof tonos }) {
  return <Etiqueta className={cn("text-sm", tonos[tono], className)} {...props} />;
}

// Cuatro tamaños en toda la app (xs, sm, xl, 2xl): el rango lo marcan el peso y la mayúscula.
const niveles = {
  1: "text-2xl font-bold tracking-tight",
  2: "text-xl font-semibold tracking-tight",
  3: "text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground",
};

export function Titulo({ nivel = 1, className, ...props }: Base & { nivel?: 1 | 2 | 3 }) {
  const Etiqueta = `h${nivel}` as ElementType;
  return <Etiqueta className={cn("text-balance", niveles[nivel], className)} {...props} />;
}
