import { z } from "zod";

type DetalleError = { campo: string; mensaje: string };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: DetalleError[],
  ) {
    super(message);
  }

  toJSON() {
    return { code: this.code, message: this.message, details: this.details };
  }
}

export function validar<T>(schema: z.ZodType<T>, datos: unknown): T {
  const resultado = schema.safeParse(datos);
  if (resultado.success) return resultado.data;

  const details = resultado.error.issues.map(({ path, message }) => ({
    campo: path.map(String).join("."),
    mensaje: message,
  }));
  throw new ApiError(422, "VALIDACION", "Revisá los datos ingresados.", details);
}

export function normalizarError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  // Los errores de base pueden incluir los parámetros de la consulta.
  console.error("Error interno:", error instanceof Error ? error.name : "desconocido");
  return new ApiError(500, "ERROR_INTERNO", "Ocurrió un error inesperado.");
}
