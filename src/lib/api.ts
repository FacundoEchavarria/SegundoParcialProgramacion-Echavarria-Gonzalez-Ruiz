import "server-only";
import { ApiError, normalizarError } from "@/lib/api-error";
import { requireApiSession } from "@/lib/auth-request";

export async function leerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "JSON_INVALIDO", "El cuerpo debe ser un JSON válido.");
  }
}

export async function rutaApi(request: Request, atender: () => Promise<Response>) {
  let respuesta: Response;
  try {
    const origen = request.headers.get("origin");
    if (request.method !== "GET" && origen) {
      const url = new URL(request.url);
      const host = request.headers.get("host");
      // Next puede normalizar 127.0.0.1 a localhost al construir Request.url.
      const origenEsperado = host ? `${url.protocol}//${host}` : url.origin;
      if (origen !== origenEsperado) {
        throw new ApiError(403, "SIN_PERMISO", "El origen de la solicitud no está permitido.");
      }
    }
    respuesta = await atender();
  } catch (error) {
    const apiError = normalizarError(error);
    respuesta = Response.json({ error: apiError.toJSON() }, { status: apiError.status });
  }
  respuesta.headers.set("Cache-Control", "no-store");
  return respuesta;
}

export function rutaConSesion(
  request: Request,
  atender: (sesion: Awaited<ReturnType<typeof requireApiSession>>) => Promise<Response>,
) {
  return rutaApi(request, async () => atender(await requireApiSession()));
}
