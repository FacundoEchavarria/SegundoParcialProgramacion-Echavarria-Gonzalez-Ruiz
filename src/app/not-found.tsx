import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Fila, Pila, Texto, Titulo } from "@/components/maquetacion";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Página no encontrada | Gestión comercial" };

// Para direcciones que no existen y para fichas inexistentes (notFound() en las páginas).
export default function NoEncontrada() {
  return (
    // Se ve igual dentro del sistema (con el panel lateral) y en una dirección suelta (sin él).
    <Fila className="min-h-[70dvh] justify-center px-4 py-10">
      <Pila gap="lg" className="w-full max-w-md rounded-xl border bg-card p-6 text-center sm:p-9">
        <Texto as="span" className="angosta border-b border-dashed border-tinta-300 pb-5 text-3xl font-bold tracking-tight text-tapa">
          Gestión comercial
        </Texto>
        <Pila gap="xs">
          <Titulo as="h1" nivel={2}>Página no encontrada</Titulo>
          <Texto tono="secundario">La factura, el producto o el cliente que buscás no existe, o la dirección está mal escrita.</Texto>
        </Pila>
        <Button asChild size="lg" className="h-11">
          <Link href="/" prefetch={false}><ArrowLeft aria-hidden />Volver al inicio</Link>
        </Button>
      </Pila>
    </Fila>
  );
}
