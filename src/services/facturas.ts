import "server-only";
import { and, count, desc, eq, gte, inArray, lt, max, or, sql } from "drizzle-orm";
import { db, transaccionEscritura } from "@/db";
import { clientes, facturaItems, facturas, movimientosCuenta, productos, usuarios } from "@/db/schema";
import { ApiError, validar } from "@/lib/api-error";
import { formatearNumeroFactura } from "@/lib/formatos";
import { anulacionSchema, listadoFacturasSchema, ventaSchema } from "@/lib/schemas/facturas";
import { usuarioIdSchema } from "@/lib/schemas/usuarios";
import type { UsuarioSesion } from "@/services/auth";
import { calcularSaldo } from "@/services/cuenta-corriente";
import { exigirAdmin, exigirAdminVigente } from "@/services/permisos";
import { moverStock } from "@/services/stock";

const puntoVenta = 1;

async function siguienteNumero(conexion: Pick<typeof db, "select">) {
  const [fila] = await conexion.select({ ultimo: max(facturas.numero) }).from(facturas)
    .where(eq(facturas.puntoVenta, puntoVenta));
  return (fila.ultimo ?? 0) + 1;
}

// RF-V1. La consulta solo muestra una estimación, sin reservar numeración.
export async function proximoNumeroFactura() {
  return { numeroFormateado: formatearNumeroFactura(puntoVenta, await siguienteNumero(db)) };
}

function importeValido(importe: number) {
  if (!Number.isSafeInteger(importe)) {
    throw new ApiError(422, "VALIDACION", "El importe de la operación está fuera de rango.");
  }
  return importe;
}

function pagoContado(montoRecibido: number, total: number) {
  if (montoRecibido < total) {
    throw new ApiError(422, "MONTO_INSUFICIENTE", "El monto recibido no cubre el total vigente.");
  }
  return { forma: "contado" as const, montoRecibido, vuelto: montoRecibido - total };
}

// RF-V6. El número, los renglones, el stock y la deuda se confirman juntos.
export async function confirmarVenta(actor: UsuarioSesion, input: unknown, fechaEmision?: Date) {
  const venta = validar(ventaSchema, input);

  return transaccionEscritura(async (tx) => {
    const [vendedor] = await tx.select({ id: usuarios.id, nombre: usuarios.nombre }).from(usuarios)
      .where(and(eq(usuarios.id, actor.id), eq(usuarios.activo, true)));
    if (!vendedor) throw new ApiError(401, "NO_AUTENTICADO", "Iniciá sesión para continuar.");

    const catalogo = await tx.select().from(productos)
      .where(inArray(productos.id, venta.items.map((item) => item.productoId)));
    const porId = new Map(catalogo.map((producto) => [producto.id, producto]));
    const pedidos = venta.items.map(({ productoId, cantidad }) => {
      const producto = porId.get(productoId);
      if (!producto) throw new ApiError(404, "NO_ENCONTRADO", `El producto ${productoId} no existe.`);
      if (!producto.activo) {
        throw new ApiError(422, "PRODUCTO_INACTIVO", `El producto ${producto.codigo} está inactivo.`);
      }
      return { producto, cantidad };
    });

    const clienteId = venta.clienteId;
    const [cliente] = clienteId === null ? [] : await tx.select().from(clientes)
      .where(eq(clientes.id, clienteId));
    if (clienteId !== null && !cliente) throw new ApiError(404, "NO_ENCONTRADO", "El cliente no existe.");
    if (venta.pago.forma === "cuenta_corriente" && (!cliente?.activo || !cliente.cuentaCorriente)) {
      throw new ApiError(422, "CUENTA_CORRIENTE_NO_HABILITADA", "La cuenta corriente no está habilitada.");
    }
    if (cliente && !cliente.activo) {
      throw new ApiError(422, "VALIDACION", "Elegí un cliente activo.", [
        { campo: "clienteId", mensaje: "El cliente está inactivo." },
      ]);
    }

    const faltantes = pedidos.filter(({ producto, cantidad }) => cantidad > producto.existencia)
      .map(({ producto, cantidad }) => ({
        productoId: producto.id, solicitado: cantidad, disponible: producto.existencia,
      }));
    if (faltantes.length) {
      throw new ApiError(409, "STOCK_INSUFICIENTE", "No hay stock suficiente para completar la venta.", faltantes);
    }

    const items = pedidos.map(({ producto, cantidad }) => ({
      productoId: producto.id,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      cantidad,
      precioUnitario: producto.precio,
      subtotal: importeValido(producto.precio * cantidad),
    }));
    const total = importeValido(items.reduce((suma, item) => suma + item.subtotal, 0));
    const pago = venta.pago.forma === "contado"
      ? pagoContado(venta.pago.montoRecibido ?? total, total)
      : venta.pago;
    let saldoCliente: number | null = null;
    if (pago.forma === "cuenta_corriente" && cliente) {
      const saldoActual = await calcularSaldo(tx, cliente.id);
      saldoCliente = importeValido(saldoActual + total);
      const limite = cliente.limiteCredito;
      if (limite !== null && saldoCliente > limite) {
        throw new ApiError(422, "LIMITE_CREDITO_EXCEDIDO", "La venta supera el límite de crédito.", {
          saldoActual, limite, excedente: saldoCliente - limite,
        });
      }
    }

    const numero = await siguienteNumero(tx);
    const numeroFormateado = formatearNumeroFactura(puntoVenta, numero);
    const creadoEn = fechaEmision ?? new Date();
    const tarjeta = pago.forma === "tarjeta" ? pago.tarjeta : undefined;
    const [factura] = await tx.insert(facturas).values({
      puntoVenta, numero, creadoEn, total, saldoCliente,
      formaPago: pago.forma,
      montoRecibido: pago.forma === "contado" ? pago.montoRecibido : null,
      usuarioId: vendedor.id,
      usuarioNombre: vendedor.nombre,
      clienteId,
      clienteNombre: cliente?.nombre,
      clienteTipoDoc: cliente?.tipoDoc,
      clienteNroDoc: cliente?.nroDoc,
      clienteDomicilio: cliente?.domicilio,
      tarjetaTipo: tarjeta?.tipo,
      tarjetaMarca: tarjeta?.marca,
      tarjetaUltimos4: tarjeta?.ultimos4,
    }).returning();

    // Una inserción por renglón evita el límite de parámetros de SQLite para ventas grandes.
    for (const item of items) {
      await tx.insert(facturaItems).values({ ...item, facturaId: factura.id, creadoEn });
    }
    for (const { productoId, cantidad } of items) {
      await moverStock(tx, {
        productoId, cantidad, usuarioId: vendedor.id, tipo: "venta",
        motivo: "Venta", facturaId: factura.id, creadoEn,
      });
    }
    if (pago.forma === "cuenta_corriente" && cliente) {
      await tx.insert(movimientosCuenta).values({
        clienteId: cliente.id, tipo: "debito", importe: total,
        descripcion: `Factura ${numeroFormateado}`, facturaId: factura.id, creadoEn,
      });
    }

    return detalleFactura(factura, items);
  });
}

export type FacturaEmitida = Awaited<ReturnType<typeof confirmarVenta>>;

type Factura = typeof facturas.$inferSelect;

function resumenFactura(factura: Factura) {
  const { id, puntoVenta, numero, creadoEn, estado, clienteId, usuarioId, usuarioNombre, total, formaPago } = factura;
  return {
    id, puntoVenta, numero, estado, total,
    numeroFormateado: formatearNumeroFactura(puntoVenta, numero),
    fecha: creadoEn.toISOString(),
    cliente: clienteId === null ? null : {
      id: clienteId,
      nombre: factura.clienteNombre!,
      tipoDoc: factura.clienteTipoDoc!,
      nroDoc: factura.clienteNroDoc!,
      domicilio: factura.clienteDomicilio,
    },
    vendedor: { id: usuarioId, nombre: usuarioNombre },
    forma: formaPago,
  };
}

function detalleFactura(factura: Factura, items: Awaited<ReturnType<typeof renglonesFactura>>) {
  const { forma, ...resumen } = resumenFactura(factura);
  // Estos datos quedaron validados y guardados al confirmar la venta.
  const pago = forma === "contado"
    ? pagoContado(factura.montoRecibido!, factura.total)
    : forma === "tarjeta"
      ? { forma, tarjeta: { tipo: factura.tarjetaTipo!, marca: factura.tarjetaMarca!, ultimos4: factura.tarjetaUltimos4! } }
      : { forma };
  const anulacion = factura.anuladaEn && {
    fecha: factura.anuladaEn.toISOString(),
    usuario: { id: factura.anuladaPorId!, nombre: factura.anuladaPorNombre! },
    motivo: factura.motivoAnulacion!,
  };
  return {
    ...resumen, items, pago,
    ...(factura.saldoCliente === null ? {} : { saldoCliente: factura.saldoCliente }),
    ...(anulacion ? { anulacion } : {}),
  };
}

function renglonesFactura(conexion: Pick<typeof db, "select">, id: number) {
  return conexion.select({
    productoId: facturaItems.productoId,
    codigo: facturaItems.codigo,
    descripcion: facturaItems.descripcion,
    cantidad: facturaItems.cantidad,
    precioUnitario: facturaItems.precioUnitario,
    subtotal: facturaItems.subtotal,
  }).from(facturaItems).where(eq(facturaItems.facturaId, id)).orderBy(facturaItems.id);
}

function inicioDiaArgentino(fecha: string) {
  return new Date(`${fecha}T00:00:00-03:00`);
}

// RF-V8. El total usa el mismo filtro que la lista, antes de paginar.
export async function listarFacturas(input: unknown) {
  const { q, desde, hasta, clienteId, vendedorId, forma, estado, page, pageSize } =
    validar(listadoFacturasSchema, input);
  const buscar = `%${q.toLowerCase().replace(/[!%_]/g, "!$&")}%`;
  // SQLite convierte a minúsculas solo ASCII. Conservamos las tildes del nombre histórico.
  const nombreBusqueda = [..."ÁÉÍÓÚÜÑ"].reduce(
    (nombre, letra) => sql`replace(${nombre}, ${letra}, ${letra.toLowerCase()})`,
    sql`${facturas.clienteNombre}`,
  );
  const numeroBusqueda = /^\d+$/.test(q)
    ? sql`printf('%08d', ${facturas.numero})`
    : sql`printf('%04d-%08d', ${facturas.puntoVenta}, ${facturas.numero})`;
  const finExclusivo = hasta ? new Date(inicioDiaArgentino(hasta).getTime() + 86_400_000) : undefined;
  const filtro = and(
    q ? or(
      sql`lower(${nombreBusqueda}) like ${buscar} escape '!'`,
      sql`${numeroBusqueda} like ${buscar} escape '!'`,
    ) : undefined,
    desde ? gte(facturas.creadoEn, inicioDiaArgentino(desde)) : undefined,
    finExclusivo ? lt(facturas.creadoEn, finExclusivo) : undefined,
    clienteId ? eq(facturas.clienteId, clienteId) : undefined,
    vendedorId ? eq(facturas.usuarioId, vendedorId) : undefined,
    forma ? eq(facturas.formaPago, forma) : undefined,
    estado ? eq(facturas.estado, estado) : undefined,
  );
  const [filas, [resumen]] = await Promise.all([
    db.select().from(facturas).where(filtro).orderBy(desc(facturas.creadoEn), desc(facturas.id))
      .limit(pageSize).offset((page - 1) * pageSize),
    db.select({
      total: count(),
      totalEmitido: sql<number>`coalesce(sum(case when ${facturas.estado} = 'emitida' then ${facturas.total} else 0 end), 0)`.mapWith(Number),
    }).from(facturas).where(filtro),
  ]);
  return { data: filas.map(resumenFactura), page, pageSize, ...resumen };
}

export async function opcionesFacturas() {
  const [compradores, vendedores] = await Promise.all([
    db.selectDistinct({ id: clientes.id, nombre: clientes.nombre }).from(facturas)
      .innerJoin(clientes, eq(clientes.id, facturas.clienteId)).orderBy(clientes.nombre, clientes.id),
    db.selectDistinct({ id: usuarios.id, nombre: usuarios.nombre }).from(facturas)
      .innerJoin(usuarios, eq(usuarios.id, facturas.usuarioId)).orderBy(usuarios.nombre, usuarios.id),
  ]);
  return { clientes: compradores, vendedores };
}

function facturaInexistente() {
  return new ApiError(404, "NO_ENCONTRADO", "La factura no existe.");
}

export async function obtenerFactura(inputId: unknown) {
  const id = validar(usuarioIdSchema, inputId);
  const [factura] = await db.select().from(facturas).where(eq(facturas.id, id));
  if (!factura) throw facturaInexistente();
  return detalleFactura(factura, await renglonesFactura(db, id));
}

// RF-V9. El estado, la devolución de stock y el crédito se confirman juntos.
export async function anularFactura(actor: UsuarioSesion, inputId: unknown, input: unknown) {
  exigirAdmin(actor);
  const id = validar(usuarioIdSchema, inputId);
  const { motivo } = validar(anulacionSchema, input);

  return transaccionEscritura(async (tx) => {
    await exigirAdminVigente(tx, actor);
    const fecha = new Date();
    const [factura] = await tx.update(facturas).set({
      estado: "anulada",
      anuladaEn: fecha,
      anuladaPorId: actor.id,
      anuladaPorNombre: actor.nombre,
      motivoAnulacion: motivo,
    }).where(and(eq(facturas.id, id), eq(facturas.estado, "emitida"))).returning();
    if (!factura) {
      const [existente] = await tx.select({ id: facturas.id }).from(facturas).where(eq(facturas.id, id));
      if (!existente) throw facturaInexistente();
      throw new ApiError(409, "FACTURA_ANULADA", "La factura ya está anulada.");
    }

    const items = await renglonesFactura(tx, id);
    for (const { productoId, cantidad } of items) {
      await moverStock(tx, {
        productoId, cantidad, usuarioId: actor.id, tipo: "anulacion",
        motivo, facturaId: id, creadoEn: fecha,
      });
    }
    if (factura.formaPago === "cuenta_corriente" && factura.clienteId !== null) {
      const numero = formatearNumeroFactura(factura.puntoVenta, factura.numero);
      await tx.insert(movimientosCuenta).values({
        clienteId: factura.clienteId, tipo: "credito", importe: factura.total,
        descripcion: `Anulación de factura ${numero}`, facturaId: id, creadoEn: fecha,
      });
    }
    return detalleFactura(factura, items);
  });
}
