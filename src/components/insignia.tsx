import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

// Activo o inactivo, para productos, categorías y clientes.
export function Estado({ activo, femenino = false }: { activo: boolean; femenino?: boolean }) {
  const etiqueta = activo ? (femenino ? "Activa" : "Activo") : (femenino ? "Inactiva" : "Inactivo");
  return <Insignia tono={activo ? "exito" : "neutro"}>{etiqueta}</Insignia>;
}

export function AvisoBajoStock() {
  return <Insignia tono="alerta">Bajo stock</Insignia>;
}
