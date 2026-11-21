"use client";

import { useId, useState, useTransition, type ComponentProps, type FormEvent } from "react";
import type { ZodType } from "zod";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import type { DetallesError } from "@/lib/api-error";
import { useAviso } from "./avisos";

type ErrorFormulario = {
  message: string;
  code?: string;
  details?: DetallesError;
};

type Resultado<T> = { ok: true; data: T } | { ok: false; error: ErrorFormulario };

export function useFormulario() {
  const avisar = useAviso();
  const [error, setError] = useState<ErrorFormulario | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  function ejecutar<T>(accion: () => Promise<Resultado<T>>, alCompletar: (data: T) => void, mensajeExito?: string) {
    setError(null);
    iniciarEnvio(async () => {
      try {
        const resultado = await accion();
        if (resultado.ok) {
          alCompletar(resultado.data);
          if (mensajeExito) avisar(mensajeExito);
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
    mensajeExito?: string,
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

    ejecutar(() => accion(validacion.data), alCompletar, mensajeExito);
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
  const idError = useId();
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium">
      <span>{etiqueta}</span>
      <Input
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
      />
      {error && <span id={idError} className="text-red-800">{error}</span>}
    </label>
  );
}

export function AvisoError({ error }: { error: ErrorFormulario | null }) {
  if (!error) return null;
  return (
    <Alert variant="destructive">{error.message}</Alert>
  );
}
