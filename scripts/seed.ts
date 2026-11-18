import { randomBytes } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { validar } from "@/lib/api-error";
import { altaUsuarioSchema } from "@/lib/schemas/usuarios";

config({ path: [".env.local", ".env"], quiet: true });

function exigirVariable(variable: string) {
  const valor = process.env[variable];
  if (!valor) throw new Error(`Falta configurar ${variable}.`);
  return valor;
}

async function main() {
  const local = exigirVariable("DATABASE_URL").startsWith("file:");
  if (!local) exigirVariable("DATABASE_AUTH_TOKEN");
  const nuevasVariables: Record<string, string> = {};

  function secreto(variable: string, bytes: number) {
    if (!local) return exigirVariable(variable);
    return process.env[variable] || (nuevasVariables[variable] = randomBytes(bytes).toString("base64url"));
  }

  if (Buffer.byteLength(secreto("SESSION_SECRET", 32)) < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 bytes.");
  }

  const { db } = await import("@/db");
  const { usuarios } = await import("@/db/schema");
  const { camposSesion } = await import("@/services/auth");
  const { crearUsuarioInicial } = await import("@/services/usuarios");
  const { cargarDemo } = await import("./seed-demo");
  const cuentas = [
    { rol: "admin", nombre: "Administrador", prefijo: "SEED_ADMIN", emailLocal: "admin@gestion.test" },
    { rol: "vendedor", nombre: "Vendedor de prueba", prefijo: "SEED_VENDEDOR", emailLocal: "vendedor@gestion.test" },
  ] as const;
  const emails = cuentas.map(({ prefijo, emailLocal }) => {
    const variable = `${prefijo}_EMAIL`;
    const valor = local ? process.env[variable] || emailLocal : exigirVariable(variable);
    return valor.trim().toLowerCase();
  });
  if (emails[0] === emails[1]) throw new Error("Usá emails distintos para las cuentas iniciales.");

  const altas = [];
  for (const [i, cuenta] of cuentas.entries()) {
    const email = emails[i];
    const variablePassword = `${cuenta.prefijo}_PASSWORD`;
    const [existente] = await db.select({ id: usuarios.id }).from(usuarios)
      .where(eq(usuarios.email, email));
    if (existente) {
      if (!local) exigirVariable(variablePassword);
      continue;
    }
    altas.push(validar(altaUsuarioSchema, {
      nombre: cuenta.nombre,
      email,
      rol: cuenta.rol,
      password: secreto(variablePassword, 18),
    }));
  }

  const vars = Object.entries(nuevasVariables).map(([nombre, valor]) => `${nombre}=${valor}`);
  if (vars.length) await appendFile(".env.local", `\n${vars.join("\n")}\n`, { mode: 0o600 });
  for (const alta of altas) await crearUsuarioInicial(alta);

  const actores = await Promise.all(emails.map(async (email) => {
    const [usuario] = await db.select({ ...camposSesion, activo: usuarios.activo }).from(usuarios)
      .where(eq(usuarios.email, email));
    return usuario;
  }));
  const [admin, vendedor] = actores;
  if (!admin?.activo || admin.rol !== "admin" || !vendedor?.activo || vendedor.rol !== "vendedor") {
    throw new Error("Las cuentas iniciales deben estar activas y tener los roles configurados.");
  }

  const cargado = await cargarDemo(admin, vendedor);
  console.log(`Cuentas iniciales: ${emails.join(", ")}.`);
  if (nuevasVariables.SEED_ADMIN_PASSWORD || nuevasVariables.SEED_VENDEDOR_PASSWORD) {
    console.log("Las contraseñas generadas se guardaron en .env.local.");
  }
  console.log(cargado
    ? "Demo cargada: 5 categorías, 30 productos, 10 clientes, 50 facturas emitidas, 1 anulada y 3 pagos."
    : "Los datos de demostración ya están cargados.");
}

main().catch((error: unknown) => {
  // No imprimimos los detalles de un error de SQL, que pueden incluir parámetros.
  process.exitCode = 1;
  if (error instanceof Error && (
    error.message.startsWith("Falta configurar ") ||
    error.message.startsWith("SESSION_SECRET ") ||
    error.message.startsWith("Usá emails ") ||
    error.message.startsWith("Las cuentas iniciales ") ||
    error.message.startsWith("La carga de demostración ")
  )) {
    console.error(error.message);
  } else {
    console.error("El seed falló. Revisá las variables y ejecutá pnpm db:migrate.");
  }
});
