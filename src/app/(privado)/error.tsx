"use client";

import { TriangleAlert } from "lucide-react";
import { Panel } from "@/components/pagina";
import { Fila, Pila, Texto, Titulo } from "@/components/maquetacion";
import { Button } from "@/components/ui/button";

// Estado de error compartido: se muestra si una pantalla no pudo cargar sus datos.
// retry vuelve a pedir los datos al servidor; reset solo redibujaría el mismo error.
export default function ErrorPantalla({ retry }: { error: Error; retry: () => void }) {
  return (
    <Panel role="alert" className="p-6 sm:p-8">
      <Pila gap="md" className="items-start">
        <Fila gap="sm">
          <TriangleAlert aria-hidden className="size-5 text-peligro" />
          <Titulo nivel={2}>No se pudo cargar esta pantalla</Titulo>
        </Fila>
        <Texto tono="secundario">Revisá la conexión y volvé a intentarlo. Si el problema sigue, avisá al administrador.</Texto>
        <Button onClick={retry}>Reintentar</Button>
      </Pila>
    </Panel>
  );
}
