import type { ReactNode } from "react";

export function ListaVacia({ children, className = "p-5" }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}
