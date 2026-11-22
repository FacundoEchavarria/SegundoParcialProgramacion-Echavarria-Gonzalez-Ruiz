"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BotonImprimir({ etiqueta = "Imprimir recibo" }: { etiqueta?: string }) {
  return <Button type="button" onClick={() => window.print()}><Printer aria-hidden />{etiqueta}</Button>;
}
