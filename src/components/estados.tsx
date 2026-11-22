import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Fila, Texto } from "@/components/maquetacion";

// Estado vacío de los listados. La carga y el error compartidos están en
// src/app/(privado)/loading.tsx y src/app/(privado)/error.tsx (convención de Next.js).
export function EstadoVacio({ children }: { children: ReactNode }) {
  return (
    <Fila role="status" gap="sm" className="justify-center px-5 py-10 text-muted-foreground">
      <Inbox aria-hidden className="size-5 text-tinta-400" />
      <Texto as="span" tono="secundario">{children}</Texto>
    </Fila>
  );
}
