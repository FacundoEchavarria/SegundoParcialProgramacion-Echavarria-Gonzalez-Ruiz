import { redirect } from "next/navigation";
import { FormularioLogin } from "@/components/acceso/formularios-sesion";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { getRequestSession } from "@/lib/auth-request";

export const metadata = { title: "Iniciar sesión | Gestión comercial" };

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ cambio?: string; salida?: string }>;
}) {
  if (await getRequestSession()) redirect("/");
  const { cambio, salida } = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <Card className="w-full max-w-md gap-7 overflow-hidden py-0">
        <header className="bg-primary px-6 py-7 text-white sm:px-8">
          <p className="text-sm font-medium text-emerald-100">Gestión comercial</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
        </header>
        <div className="grid gap-4 px-6 pb-7 sm:px-8 sm:pb-8">
          {(cambio === "1" || salida === "1") && (
            <Alert variant="success" role="status">
              {cambio === "1" ? "Contraseña actualizada. Ingresá con tu nueva contraseña." : "Sesión cerrada."}
            </Alert>
          )}
          <FormularioLogin />
        </div>
      </Card>
    </main>
  );
}
