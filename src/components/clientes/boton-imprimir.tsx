"use client";

import { clasePrincipal } from "@/components/acceso/estilos";

export function BotonImprimir() {
  return <button type="button" className={clasePrincipal} onClick={() => window.print()}>Imprimir recibo</button>;
}
