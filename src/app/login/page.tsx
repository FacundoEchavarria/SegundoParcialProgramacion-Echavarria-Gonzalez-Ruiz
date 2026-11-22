import { redirect } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { FormularioLogin } from "@/components/acceso/formularios-sesion";
import { Fila, Grilla, Pila, Texto, Titulo } from "@/components/maquetacion";
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
    <Grilla className="min-h-dvh gap-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* La tapa del cuaderno, con su etiqueta blanca. */}
      <Fila className="justify-center bg-tapa px-6 py-8 lg:py-16">
        <Pila gap="xs" className="w-full max-w-sm rounded-lg bg-card px-6 py-5 text-center shadow-[0_18px_40px_-16px_rgb(16_22_38/0.55)] ring-1 ring-tinta-300 ring-inset lg:py-8">
          <Texto as="span" className="text-2xl font-bold tracking-tight text-tapa">Gestión comercial</Texto>
          <Texto as="span" tono="secundario" className="border-t border-dashed border-tinta-300 pt-2 text-xs font-semibold tracking-[0.08em] uppercase">
            Ventas · Stock · Cuentas corrientes
          </Texto>
        </Pila>
      </Fila>
      <Fila as="main" className="justify-center px-5 py-10 sm:px-10">
        <Pila gap="lg" className="w-full max-w-sm">
          <Pila gap="xs">
            <Titulo>Iniciar sesión</Titulo>
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
    </Grilla>
  );
}
