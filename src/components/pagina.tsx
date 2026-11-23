import type { ComponentProps, ReactNode } from "react";
import { Fila, Pila, Texto, Titulo } from "@/components/maquetacion";
import { claseCampo } from "@/components/acceso/estilos";
import { Input } from "@/components/ui/input";
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

// Formulario de filtros: viaja por GET, así búsqueda, filtros y página quedan en la URL.
export function FormularioFiltros({ action, className, children }: { action: string; className?: string; children: ReactNode }) {
  return <form action={action} method="get" className={cn("border-b p-4 sm:p-5", className)}>{children}</form>;
}

// Campo de un formulario de filtros (GET): etiqueta arriba y el control debajo.
export function CampoFiltro({ etiqueta, className, children }: { etiqueta: string; className?: string; children: ReactNode }) {
  return (
    <Label className={cn("grid min-w-0 content-start gap-1.5", className)}>
      {etiqueta}
      {children}
    </Label>
  );
}

// Controles de los filtros: el Input de shadcn y un select nativo, los dos con el estilo de campo de la app.
export function EntradaFiltro(props: Omit<ComponentProps<"input">, "className">) {
  return <Input className={cn(claseCampo, "shadow-none")} {...props} />;
}

export function SelectorFiltro({ opciones, vacio, ...props }: Omit<ComponentProps<"select">, "className" | "children"> & {
  opciones: [valor: string | number, etiqueta: string][];
  vacio?: string;
}) {
  return (
    <select className={claseCampo} {...props}>
      {vacio !== undefined && <option value="">{vacio}</option>}
      {opciones.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
    </select>
  );
}

// Casilla de verificación de un filtro, con la etiqueta a su derecha.
export function CasillaFiltro({ etiqueta, ...props }: Omit<ComponentProps<"input">, "className" | "type"> & { etiqueta: string }) {
  return (
    <Label className="min-h-10">
      <input type="checkbox" className="size-4 accent-tapa" {...props} />
      {etiqueta}
    </Label>
  );
}

// Bloque plegable: muestra el resumen y despliega el contenido al tocarlo.
export function Desplegable({ resumen, className, children }: { resumen: string; className?: string; children: ReactNode }) {
  return (
    <details className={className}>
      <summary className="cursor-pointer font-medium text-tapa">{resumen}</summary>
      {children}
    </details>
  );
}

// Fecha legible con su valor ISO para lectores de pantalla y buscadores.
export function Fecha({ iso, className, children }: { iso: string; className?: string; children: ReactNode }) {
  return <time dateTime={iso} className={className}>{children}</time>;
}

// Cifra grande de una ficha (saldo, importe, existencia).
export function Cifra({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn("angosta font-bold", className)}>{children}</span>;
}

// Renglón etiqueta/valor alineado a los costados; va dentro de un <dl>.
export function Renglon({ etiqueta, children, className, claseEtiqueta, claseValor }: {
  etiqueta: ReactNode;
  children: ReactNode;
  className?: string;
  claseEtiqueta?: string;
  claseValor?: string;
}) {
  return (
    <div className={cn("flex justify-between gap-3", className)}>
      <dt className={cn("text-muted-foreground", claseEtiqueta)}>{etiqueta}</dt>
      <dd className={cn("font-medium", claseValor)}>{children}</dd>
    </div>
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
