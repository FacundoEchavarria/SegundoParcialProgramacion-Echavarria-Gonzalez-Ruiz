"use client";

import { TriangleAlert } from "lucide-react";
import { Fila, Pila, Texto, Titulo } from "@/components/maquetacion";
import { Panel } from "@/components/pagina";
import { Button } from "@/components/ui/button";

// Estado de error compartido: se muestra si una pantalla no pudo cargar sus datos.
export default function ErrorPantalla({ reset }: { error: Error; reset: () => void }) {
  return (
    <Panel role="alert" className="p-6 sm:p-8">
      <Pila gap="md" className="items-start">
        <Fila gap="sm">
          <TriangleAlert aria-hidden className="size-5 text-peligro" />
          <Titulo nivel={2}>No se pudo cargar esta pantalla</Titulo>
        </Fila>
        <Texto tono="secundario">Revisá la conexión y volvé a intentarlo. Si el problema sigue, avisá al administrador.</Texto>
        <Button onClick={reset}>Reintentar</Button>
      </Pila>
    </Panel>
  );
}
