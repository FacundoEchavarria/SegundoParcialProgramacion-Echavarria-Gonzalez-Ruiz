"use client";


import { Button } from "@/components/ui/button";
export function BotonImprimir({ etiqueta = "Imprimir recibo" }: { etiqueta?: string }) {
  return <Button type="button" onClick={() => window.print()}>{etiqueta}</Button>;
}
