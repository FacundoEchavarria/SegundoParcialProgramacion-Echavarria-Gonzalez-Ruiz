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
  searchParams: Promise<{ cambio?: string; salida?: string }>;
}) {
  if (await getRequestSession()) redirect("/");
  const { cambio, salida } = await searchParams;

  return (
    // Toda la pantalla es la tapa azul; el formulario es su etiqueta blanca, centrada.
    <Fila as="main" className="min-h-dvh flex-col justify-center gap-6 bg-tapa px-4 py-10">
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
        {(cambio === "1" || salida === "1") && (
          <Fila role="status" gap="sm" className="rounded-lg bg-exito-fondo px-3 py-2.5 font-medium text-exito">
            <CircleCheck aria-hidden className="size-4 shrink-0" />
            {cambio === "1" ? "Contraseña actualizada. Ingresá con tu nueva contraseña." : "Sesión cerrada."}
          </Fila>
        )}
        <FormularioLogin rolesDemo={rolesDemoDisponibles()} />
      </Pila>
      {/* Integrantes del grupo: debajo del formulario en pantallas chicas y fijos en la
          esquina inferior derecha desde xl, donde ya no se superponen con el formulario. */}
      <aside className="w-full max-w-md rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-white shadow-lg backdrop-blur-md xl:fixed xl:right-5 xl:bottom-5 xl:w-auto">
        <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-white/60 uppercase">Integrantes</p>
        <ul className="space-y-1.5 text-sm xl:text-base">
          {[
            ["Facundo Echavarria Pacios", "63404"],
            ["Pablo Hernan Gonzalez", "63630"],
            ["Marcos Benjamin Ruiz", "63403"],
          ].map(([nombre, legajo]) => (
            <li key={legajo} className="flex items-baseline justify-between gap-4">
              <span className="font-medium">{nombre}</span>
              <span className="font-mono text-white/70 tabular-nums">{legajo}</span>
            </li>
          ))}
        </ul>
      </aside>
    </Fila>
  );
}
