import "server-only";
import { randomBytes } from "node:crypto";
import { and, count, eq, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { sesiones, usuarios } from "@/db/schema";
import { ApiError, validar } from "@/lib/api-error";
import { exigirCuentaModificable } from "@/lib/demo";
import {
  altaUsuarioSchema,
  edicionUsuarioSchema,
  listadoUsuariosSchema,
  usuarioIdSchema,
} from "@/lib/schemas/usuarios";
import { calcularHash, camposSesion, type UsuarioSesion } from "@/services/auth";
import { exigirAdmin, exigirAdminVigente } from "@/services/permisos";

const camposUsuario = {
  ...camposSesion,
  activo: usuarios.activo,
  creadoEn: usuarios.creadoEn,
};

function usuarioPublico(usuario: Pick<typeof usuarios.$inferSelect, keyof typeof camposUsuario>) {
  return { ...usuario, creadoEn: usuario.creadoEn.toISOString() };
}

function emailDuplicado() {
  return new ApiError(409, "EMAIL_DUPLICADO", "Ya existe un usuario con ese email.");
}

function usuarioInexistente() {
  return new ApiError(404, "NO_ENCONTRADO", "El usuario no existe.");
}

// RF-U4.
export async function listarUsuarios(actor: UsuarioSesion, input: unknown) {
  const { q, activo, page, pageSize } = validar(listadoUsuariosSchema, input);
  exigirAdmin(actor);

  const buscar = `%${q.replace(/[!%_]/g, "!$&")}%`;
  const filtro = and(
    q ? or(
      sql`${usuarios.nombre} like ${buscar} escape '!'`,
      sql`${usuarios.email} like ${buscar} escape '!'`,
    ) : undefined,
    activo === undefined ? undefined : eq(usuarios.activo, activo === "true"),
  );
  const [filas, [resumen]] = await Promise.all([
    db.select(camposUsuario).from(usuarios).where(filtro)
      .orderBy(usuarios.nombre, usuarios.id).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(usuarios).where(filtro),
  ]);

  return { data: filas.map(usuarioPublico), page, pageSize, total: resumen.total };
}

// RF-U4.
export async function crearUsuario(actor: UsuarioSesion, input: unknown) {
  const { password, ...datos } = validar(altaUsuarioSchema, input);
  exigirAdmin(actor);
  const passwordHash = await calcularHash(password);

  return db.transaction(async (tx) => {
    await exigirAdminVigente(tx, actor);
    const [nuevo] = await tx.insert(usuarios).values({ ...datos, passwordHash })
      .onConflictDoNothing({ target: usuarios.email }).returning(camposUsuario);
    if (!nuevo) throw emailDuplicado();
    return usuarioPublico(nuevo);
  });
}

async function exigirDestinoModificable(tx: Pick<typeof db, "select">, id: number) {
  const [destino] = await tx.select({ email: usuarios.email }).from(usuarios).where(eq(usuarios.id, id));
  if (destino) exigirCuentaModificable(destino.email);
}

// RF-U4. Desactivar revoca las sesiones y conserva el usuario para su historial.
export async function editarUsuario(actor: UsuarioSesion, inputId: unknown, input: unknown) {
  const id = validar(usuarioIdSchema, inputId);
  const datos = validar(edicionUsuarioSchema, input);
  exigirAdmin(actor);
  if (id === actor.id && (datos.activo === false || datos.rol === "vendedor")) {
    throw new ApiError(422, "OPERACION_SOBRE_SI_MISMO", "No podés desactivarte ni quitarte tu rol.");
  }

  return db.transaction(async (tx) => {
    await exigirAdminVigente(tx, actor);
    await exigirDestinoModificable(tx, id);
    if (datos.email) {
      const [otro] = await tx.select({ id: usuarios.id }).from(usuarios).where(and(
        eq(usuarios.email, datos.email), ne(usuarios.id, id),
      ));
      if (otro) throw emailDuplicado();
    }
    const [actualizado] = await tx.update(usuarios).set(datos)
      .where(eq(usuarios.id, id)).returning(camposUsuario);
    if (!actualizado) throw usuarioInexistente();
    if (datos.activo === false) {
      await tx.delete(sesiones).where(eq(sesiones.usuarioId, id));
    }
    return usuarioPublico(actualizado);
  });
}

// RF-U5.
export async function restablecerPassword(actor: UsuarioSesion, inputId: unknown) {
  const id = validar(usuarioIdSchema, inputId);
  exigirAdmin(actor);
  const passwordTemporal = randomBytes(18).toString("base64url");
  const passwordHash = await calcularHash(passwordTemporal);

  await db.transaction(async (tx) => {
    await exigirAdminVigente(tx, actor);
    await exigirDestinoModificable(tx, id);
    const [actualizado] = await tx.update(usuarios).set({ passwordHash })
      .where(eq(usuarios.id, id)).returning({ id: usuarios.id });
    if (!actualizado) throw usuarioInexistente();
    await tx.delete(sesiones).where(eq(sesiones.usuarioId, id));
  });

  return { passwordTemporal };
}

// RF-U3. Ejecutado por el seed con configuración del entorno.
export async function crearUsuarioInicial(input: unknown) {
  const { password, ...datos } = validar(altaUsuarioSchema, input);
  await db.insert(usuarios).values({ ...datos, passwordHash: await calcularHash(password) })
    .onConflictDoNothing({ target: usuarios.email });
}
