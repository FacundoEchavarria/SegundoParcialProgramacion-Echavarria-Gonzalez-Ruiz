import type { ComponentProps, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Fila, Pila, Texto, Titulo } from "@/components/maquetacion";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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

// Insignias de estado: un solo componente para todos los estados de la app.
const tonosInsignia = {
  exito: "bg-exito-fondo text-exito",
  alerta: "bg-alerta-fondo text-alerta",
  peligro: "bg-peligro-fondo text-peligro",
  neutro: "bg-tinta-100 text-tinta-600",
  info: "bg-tapa-clara text-tapa",
};

export function Insignia({ tono = "neutro", children }: { tono?: keyof typeof tonosInsignia; children: ReactNode }) {
  return <Badge className={cn("font-semibold", tonosInsignia[tono])}>{children}</Badge>;
}

// Campo de un formulario de filtros (GET): etiqueta arriba y el control debajo.
export function CampoFiltro({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <Label className="grid min-w-0 content-start gap-1.5">
      {etiqueta}
      {children}
    </Label>
  );
}

// Par etiqueta/valor de una ficha; va dentro de un <dl>.
export function Dato({ etiqueta, children, className }: { etiqueta: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid min-w-0 content-start gap-0.5", className)}>
      <dt className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">{etiqueta}</dt>
      <dd className="break-words">{children}</dd>
    </div>
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
