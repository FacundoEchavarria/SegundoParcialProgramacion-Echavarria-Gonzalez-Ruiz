import "server-only";
import { errors, jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "sesion";
const algorithms = ["HS256"];

function claveSesion() {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto || Buffer.byteLength(secreto) < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 bytes.");
  }
  return new TextEncoder().encode(secreto);
}

export function firmarSesion(id: string, venceEn: Date) {
  return new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setJti(id)
    .setExpirationTime(Math.floor(venceEn.getTime() / 1000))
    .sign(claveSesion());
}

export async function leerSesionFirmada(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, claveSesion(), {
      algorithms,
      requiredClaims: ["jti", "exp"],
    });
    return typeof payload.jti === "string" ? payload.jti : null;
  } catch (error) {
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }
}
