import type { ComponentProps, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Fila, Pila, Texto, Titulo } from "@/components/maquetacion";
import { cn } from "@/lib/utils";

export function EncabezadoPagina({ titulo, descripcion, acciones, className }: {
  titulo: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  className?: string;
}) {
  return (
    <Fila as="header" gap="md" className={cn("justify-between print:hidden", className)}>
      <Pila gap="xs" className="min-w-0">
        <Titulo tabIndex={-1}>{titulo}</Titulo>
        {descripcion && <Texto tono="secundario">{descripcion}</Texto>}
      </Pila>
      {acciones && <Fila>{acciones}</Fila>}
    </Fila>
  );
}

// Superficie blanca para tablas y formularios; un solo nivel, nunca anidada.
export function Panel({ className, children, ...props }: { className?: string; children: ReactNode } & ComponentProps<"section">) {
  return (
    <section className={cn("min-w-0 rounded-xl border bg-card", className)} {...props}>
      {children}
    </section>
  );
}

export function EstadoVacio({ children }: { children: ReactNode }) {
  return (
    <Fila role="status" gap="sm" className="justify-center px-5 py-10 text-muted-foreground">
      <Inbox aria-hidden className="size-5 text-tinta-400" />
      <Texto as="span" tono="secundario">{children}</Texto>
    </Fila>
  );
}
