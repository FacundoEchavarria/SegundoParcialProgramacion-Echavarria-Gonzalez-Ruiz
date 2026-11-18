import "server-only";
import { and, eq, inArray, max } from "drizzle-orm";
import { db, transaccionEscritura } from "@/db";
import { clientes, facturaItems, facturas, movimientosCuenta, productos, usuarios } from "@/db/schema";
import { ApiError, validar } from "@/lib/api-error";
import { formatearNumeroFactura } from "@/lib/formatos";
import { ventaSchema } from "@/lib/schemas/facturas";
import type { UsuarioSesion } from "@/services/auth";
import { calcularSaldo } from "@/services/cuenta-corriente";
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
export async function confirmarVenta(actor: UsuarioSesion, input: unknown) {
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
    const creadoEn = new Date();
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
    }).returning({ id: facturas.id, creadoEn: facturas.creadoEn });

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

    return {
      id: factura.id,
      puntoVenta,
      numero,
      numeroFormateado,
      fecha: factura.creadoEn.toISOString(),
      estado: "emitida" as const,
      cliente: cliente ? {
        id: cliente.id, nombre: cliente.nombre, tipoDoc: cliente.tipoDoc,
        nroDoc: cliente.nroDoc, domicilio: cliente.domicilio,
      } : null,
      vendedor,
      items,
      total,
      pago,
      ...(saldoCliente === null ? {} : { saldoCliente }),
    };
  });
}

export type FacturaEmitida = Awaited<ReturnType<typeof confirmarVenta>>;
