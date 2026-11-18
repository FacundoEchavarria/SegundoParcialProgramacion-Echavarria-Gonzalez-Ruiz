"use client";

import { clasePrincipal } from "@/components/acceso/estilos";

export function BotonImprimir({ etiqueta = "Imprimir recibo" }: { etiqueta?: string }) {
  return <button type="button" className={clasePrincipal} onClick={() => window.print()}>{etiqueta}</button>;
}
