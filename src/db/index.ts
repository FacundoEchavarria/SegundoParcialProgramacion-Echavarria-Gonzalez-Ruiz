import "server-only";
import { drizzle } from "drizzle-orm/libsql/node";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("Falta configurar DATABASE_URL.");
}

export const db = drizzle({
  connection: {
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
});

export type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];

function esBloqueoTemporal(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if ("code" in error && typeof error.code === "string" && error.code.startsWith("SQLITE_BUSY")) {
    return true;
  }
  return esBloqueoTemporal(error.cause);
}

// SQLite puede rechazar temporalmente una escritura si otra tiene el bloqueo.
export async function transaccionEscritura<T>(operacion: (tx: Transaccion) => Promise<T>) {
  for (let intento = 0; ; intento++) {
    try {
      return await db.transaction(operacion);
    } catch (error) {
      if (!esBloqueoTemporal(error) || intento === 4) throw error;
      await new Promise((resolver) => setTimeout(resolver, 25 * 2 ** intento));
    }
  }
}
