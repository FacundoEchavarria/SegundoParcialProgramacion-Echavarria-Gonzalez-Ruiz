import { redirect } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { FormularioLogin } from "@/components/acceso/formularios-sesion";
import { Fila, Pila, Texto, Titulo } from "@/components/maquetacion";
import { getRequestSession } from "@/lib/auth-request";
import { rolesDemoDisponibles } from "@/lib/demo";

export const metadata = { title: "Iniciar sesión | Gestión comercial" };

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ cambio?: string }>;
}) {
  if (await getRequestSession()) redirect("/");
  const { cambio } = await searchParams;

  return (
    // Toda la pantalla es la tapa azul; el formulario es su etiqueta blanca, centrada.
    <Fila as="main" className="min-h-dvh justify-center bg-tapa px-4 py-10">
      <Pila gap="lg" className="w-full max-w-md rounded-xl bg-card p-6 shadow-[0_24px_60px_-24px_rgb(16_22_38/0.7)] sm:p-9">
        <Pila gap="xs" className="items-center border-b border-dashed border-tinta-300 pb-5 text-center">
          <Texto as="span" className="angosta text-3xl font-bold tracking-tight text-tapa">Gestión comercial</Texto>
          <Texto as="span" tono="secundario" className="text-xs font-semibold tracking-[0.08em] uppercase">
            Ventas · Stock · Cuentas corrientes
          </Texto>
        </Pila>
        <Pila gap="xs">
          <Titulo as="h1" nivel={2}>Iniciar sesión</Titulo>
          <Texto tono="secundario">Ingresá con tu email y contraseña.</Texto>
        </Pila>
        {cambio === "1" && (
          <Fila role="status" gap="sm" className="rounded-lg bg-exito-fondo px-3 py-2.5 font-medium text-exito">
            <CircleCheck aria-hidden className="size-4 shrink-0" />
            Contraseña actualizada. Ingresá con tu nueva contraseña.
          </Fila>
        )}
        <FormularioLogin rolesDemo={rolesDemoDisponibles()} />
      </Pila>
    </Fila>
  );
}
