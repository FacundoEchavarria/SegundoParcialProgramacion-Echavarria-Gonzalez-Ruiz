import { FormularioPassword } from "@/components/acceso/formularios-sesion";
import { Card } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth-request";

export const metadata = { title: "Mi perfil | Gestión comercial" };

export default async function Perfil() {
  const usuario = await requirePageUser();

  return (
    <section className="grid max-w-lg gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Mi perfil</h1>
        <p className="mt-2 break-all text-muted-foreground">{usuario.email}</p>
      </header>
      <Card className="gap-5 px-5 sm:px-7">
        <h2 className="text-xl font-semibold">Cambiar contraseña</h2>
        <FormularioPassword />
      </Card>
    </section>
  );
}
