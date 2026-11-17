import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usuarios = sqliteTable(
  "usuarios",
  {
    id: integer().primaryKey(),
    nombre: text().notNull(),
    email: text().notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    rol: text({ enum: ["admin", "vendedor"] }).notNull(),
    activo: integer({ mode: "boolean" }).notNull().default(true),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (tabla) => [
    check("usuarios_rol_valido", sql`${tabla.rol} in ('admin', 'vendedor')`),
  ],
);
