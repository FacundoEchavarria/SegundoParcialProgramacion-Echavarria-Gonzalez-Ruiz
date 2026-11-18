import "server-only";
import { and, count, desc, eq, gt, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { facturaItems, facturas, movimientosCuenta, productos } from "@/db/schema";
import { sumaCuenta } from "@/services/cuenta-corriente";

const diaMs = 86_400_000;
const diferenciaArgentinaMs = 3 * 60 * 60 * 1000;

function fechaISO(instante: number) {
  return new Date(instante).toISOString().slice(0, 10);
}

function inicioDiaArgentino(fecha: string) {
  return new Date(`${fecha}T00:00:00-03:00`);
}

// RF-T1 a RF-T3. Las anulaciones quedan fuera de todos los indicadores de venta.
export async function obtenerTablero(ahora = new Date()) {
  const horaArgentina = ahora.getTime() - diferenciaArgentinaMs;
  const hoy = fechaISO(horaArgentina);
  const primerDiaSerie = fechaISO(horaArgentina - 29 * diaMs);
  const primerDiaMes = `${hoy.slice(0, 7)}-01`;
  const finExclusivo = inicioDiaArgentino(fechaISO(horaArgentina + diaMs));

  // creado_en guarda segundos UTC. El agrupamiento usa la fecha de Argentina.
  const fechaVenta = sql<string>`date(${facturas.creadoEn}, 'unixepoch', '-3 hours')`;
  const emitidas = eq(facturas.estado, "emitida");
  const importeVentas = sql<number>`sum(${facturas.total})`.mapWith(Number);
  const saldos = db.select({ saldo: sumaCuenta.as("saldo") }).from(movimientosCuenta)
    .groupBy(movimientosCuenta.clienteId).as("saldos");
  const unidadesVendidas = sql<number>`sum(${facturaItems.cantidad})`.mapWith(Number);

  const [ventas, [cuentasCorrientes], [bajoMinimo], masVendidos] = await Promise.all([
    db.select({ fecha: fechaVenta, forma: facturas.formaPago, cantidad: count(), importe: importeVentas })
      .from(facturas).where(and(
        emitidas,
        gte(facturas.creadoEn, inicioDiaArgentino(primerDiaMes < primerDiaSerie ? primerDiaMes : primerDiaSerie)),
        lt(facturas.creadoEn, finExclusivo),
      )).groupBy(fechaVenta, facturas.formaPago),
    db.select({
      clientesConSaldo: count(),
      totalAdeudado: sql<number>`coalesce(sum(${saldos.saldo}), 0)`.mapWith(Number),
    }).from(saldos).where(gt(saldos.saldo, 0)),
    db.select({ cantidad: count() }).from(productos)
      .where(and(eq(productos.activo, true), lt(productos.existencia, productos.stockMinimo))),
    db.select({
      productoId: productos.id,
      codigo: productos.codigo,
      descripcion: productos.descripcion,
      unidades: unidadesVendidas,
      importe: sql<number>`sum(${facturaItems.subtotal})`.mapWith(Number),
    }).from(facturaItems)
      .innerJoin(facturas, eq(facturas.id, facturaItems.facturaId))
      .innerJoin(productos, eq(productos.id, facturaItems.productoId))
      .where(and(emitidas, gte(facturas.creadoEn, inicioDiaArgentino(primerDiaMes)), lt(facturas.creadoEn, finExclusivo)))
      .groupBy(productos.id, productos.codigo, productos.descripcion)
      .orderBy(desc(unidadesVendidas), productos.id).limit(5),
  ]);

  const ventasHoy = { cantidad: 0, importe: 0 };
  const mes = { cantidad: 0, importe: 0, ticketPromedio: 0 };
  const importesPorForma = { contado: 0, tarjeta: 0, cuenta_corriente: 0 };
  const importesPorFecha = new Map<string, number>();

  for (const { fecha, forma, cantidad, importe } of ventas) {
    importesPorFecha.set(fecha, (importesPorFecha.get(fecha) ?? 0) + importe);
    if (fecha === hoy) {
      ventasHoy.cantidad += cantidad;
      ventasHoy.importe += importe;
    }
    if (fecha >= primerDiaMes) {
      mes.cantidad += cantidad;
      mes.importe += importe;
      importesPorForma[forma] += importe;
    }
  }
  if (mes.cantidad) mes.ticketPromedio = Math.round(mes.importe / mes.cantidad);

  const ventasDiarias = Array.from({ length: 30 }, (_, indice) => {
    const fecha = fechaISO(horaArgentina + (indice - 29) * diaMs);
    return { fecha, importe: importesPorFecha.get(fecha) ?? 0 };
  });
  const formas = ["contado", "tarjeta", "cuenta_corriente"] as const;
  const porFormaDePago = formas.map((forma) => ({ forma, importe: importesPorForma[forma] }));

  return { hoy: ventasHoy, mes, cuentasCorrientes, bajoMinimo, ventasDiarias, porFormaDePago, masVendidos };
}

export type Tablero = Awaited<ReturnType<typeof obtenerTablero>>;
