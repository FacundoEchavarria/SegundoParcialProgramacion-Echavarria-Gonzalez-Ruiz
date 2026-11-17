import Link from "next/link";
import { Card } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth-request";

export default async function Inicio() {
  const usuario = await requirePageUser();

  return (
    <section className="grid gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Inicio</h1>
      <Card className="gap-4 border-t-4 border-t-primary px-6 py-7 sm:px-8">
        <h2 className="text-xl font-semibold">Hola, {usuario.nombre}</h2>
        <p className="text-muted-foreground">Administrá tu acceso desde tu perfil.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/perfil" prefetch={false} className="font-medium text-primary underline underline-offset-4">Mi perfil</Link>
          {usuario.rol === "admin" && (
            <Link href="/usuarios" prefetch={false} className="font-medium text-primary underline underline-offset-4">
              Gestionar usuarios
            </Link>
          )}
        </div>
      </Card>
    </section>
  );
}
