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
