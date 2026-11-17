"use client";

import { useId, useState, useTransition, type ComponentProps, type FormEvent } from "react";
import type { ZodType } from "zod";
import { claseCampo } from "./estilos";

type ErrorFormulario = {
  message: string;
  details?: { campo: string; mensaje: string }[];
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
    errorCampo: (campo: string) => error?.details?.find((detalle) => detalle.campo === campo)?.mensaje,
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
      <input
        {...props}
        className={claseCampo}
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
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
      {error.message}
    </p>
  );
}
