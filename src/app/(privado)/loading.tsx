import { Panel } from "@/components/pagina";
import { Pila } from "@/components/maquetacion";
import { Skeleton } from "@/components/ui/skeleton";

// Estado de carga compartido por todas las pantallas del sistema.
export default function Cargando() {
  return (
    <Pila gap="lg" role="status" aria-label="Cargando">
      <Pila gap="sm">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </Pila>
      <Panel className="p-5">
        <Pila gap="md">
          {Array.from({ length: 6 }, (_, fila) => <Skeleton key={fila} className="h-5 w-full" />)}
        </Pila>
      </Panel>
    </Pila>
  );
}
