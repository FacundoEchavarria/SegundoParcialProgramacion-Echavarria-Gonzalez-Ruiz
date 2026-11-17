import { leerJson, rutaApi } from "@/lib/api";
import { escribirCookieSesion } from "@/lib/auth-request";
import { iniciarSesion } from "@/services/auth";

export function POST(request: Request) {
  return rutaApi(request, async () => {
    const { id, usuario, venceEn } = await iniciarSesion(await leerJson(request));
    await escribirCookieSesion(id, venceEn);
    return Response.json(usuario);
  });
}
