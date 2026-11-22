"use client";

import { useId, useState, useTransition, type ComponentProps, type FormEvent } from "react";
import type { ZodType } from "zod";
import { CircleAlert } from "lucide-react";
import type { DetallesError } from "@/lib/api-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ErrorFormulario = {
  message: string;
  code?: string;
  details?: DetallesError;
};

type Resultado<T> = { ok: true; data: T } | { ok: false; error: ErrorFormulario };

export function useFormulario() {
  const [error, setError] = useState<ErrorFormulario | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  function ejecutar<T>(accion: () => Promise<Resultado<T>>, alCompletar: (data: T) => void) {
    setError(null);
    iniciarEnvio(async () => {
      try {
        const resultado = await accion();
        if (resultado.ok) {
          alCompletar(resultado.data);
        } else {
          setError(resultado.error);
        }
      } catch {
        setError({ message: "No se pudo completar la solicitud. Volvé a intentarlo." });
      }
    });
  }

  function enviar<T>(
    event: FormEvent<HTMLFormElement>,
    esquema: ZodType,
    accion: (datos: unknown) => Promise<Resultado<T>>,
    alCompletar: (data: T) => void,
  ) {
    event.preventDefault();
    const datos = Object.fromEntries(new FormData(event.currentTarget));
    const validacion = esquema.safeParse(datos);

    if (!validacion.success) {
      setError({
        message: "Revisá los campos indicados.",
        details: validacion.error.issues.map((issue) => ({
          campo: issue.path.join("."),
          mensaje: issue.message,
        })),
      });
      return;
    }

    ejecutar(() => accion(validacion.data), alCompletar);
  }

  return {
    error,
    enviando,
    enviar,
    ejecutar,
    limpiarError: () => setError(null),
    errorCampo: (campo: string) => {
      const detalles = error?.details;
      if (!Array.isArray(detalles)) return undefined;
      const detalle = detalles.find((item) => "campo" in item && item.campo === campo);
      return detalle && "mensaje" in detalle ? detalle.mensaje : undefined;
    },
  };
}

export function Campo({
  etiqueta,
  error,
  ...props
}: Omit<ComponentProps<"input">, "className"> & { etiqueta: string; error?: string }) {
  const id = useId();
  const idError = `${id}-error`;
  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Input
        {...props}
        id={id}
        className="h-10 bg-card"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
      />
      {error && <p id={idError} className="text-xs font-medium text-peligro">{error}</p>}
    </div>
  );
}

export function AvisoError({ error }: { error: ErrorFormulario | null }) {
  if (!error) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-peligro-fondo px-3 py-2.5 text-sm font-medium text-peligro">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>{error.message}</p>
    </div>
  );
}
