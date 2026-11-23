import assert from "node:assert/strict";
import { after, test } from "node:test";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";

process.env.DATABASE_URL = "file::memory:";
process.env.DATABASE_AUTH_TOKEN = "";
const { db } = await import("@/db");
after(() => db.$client.close());

await migrate(db, { migrationsFolder: "drizzle" });
const { usuarios } = await import("@/db/schema");
const { anularFactura, confirmarVenta, obtenerFactura } = await import("@/services/facturas");
const { crearCategoria, crearProducto, obtenerProducto } = await import("@/services/productos");
const { crearCliente } = await import("@/services/clientes");
const { registrarPago, obtenerPago } = await import("@/services/pagos");
const { obtenerCuenta } = await import("@/services/cuenta-corriente");

const [admin, vendedor] = await db.insert(usuarios).values([
  { nombre: "Admin", email: "admin@gestion.test", rol: "admin", passwordHash: "prueba" },
  { nombre: "Vendedor", email: "vendedor@gestion.test", rol: "vendedor", passwordHash: "prueba" },
]).returning();
const categoria = await crearCategoria(admin, { nombre: "Pruebas" });
const motivo = "Devolución de mercadería";
let numero = 0;

async function emitir() {
  numero++;
  const cliente = await crearCliente(vendedor, {
    nombre: `Cliente ${numero}`, tipoDoc: "DNI", nroDoc: String(40000000 + numero), cuentaCorriente: true,
  });
  const producto = await crearProducto(admin, {
    codigo: `PRUEBA-${numero}`, descripcion: "Producto de prueba",
    categoriaId: categoria.id, precio: 100_000, stockInicial: 1, stockMinimo: 0,
  });
  const factura = await confirmarVenta(vendedor, {
    clienteId: cliente.id, items: [{ productoId: producto.id, cantidad: 1 }],
    pago: { forma: "cuenta_corriente" },
  });
  return { cliente, producto, factura };
}

test("anula una factura pendiente con un crédito y repone el stock", async () => {
  const { cliente, producto, factura } = await emitir();
  const resultado = await anularFactura(admin, factura.id, { motivo });
  assert.equal(resultado.estado, "anulada");
  assert.equal(resultado.anulacion?.importeDevuelto, undefined);
  assert.equal((await obtenerProducto(admin, producto.id)).existencia, 1);
  assert.deepEqual((await obtenerCuenta(admin, cliente.id, {})).movimientos.map(({ saldo }) => saldo), [100_000, 0]);
});

test("exige el importe vigente para pagos parciales y totales y conserva el recibo", async () => {
  const { cliente, producto, factura } = await emitir();
  const pago = await registrarPago(vendedor, cliente.id, { importe: 80_000, medio: "efectivo" });
  const devolucionRequerida = (importeDevuelto: number) => ({
    status: 409, code: "DEVOLUCION_REQUERIDA", details: { importeDevuelto },
  });

  await assert.rejects(anularFactura(admin, factura.id, { motivo }), devolucionRequerida(80_000));
  assert.equal((await obtenerProducto(admin, producto.id)).existencia, 0);
  assert.equal((await obtenerFactura(factura.id)).estado, "emitida");

  await registrarPago(vendedor, cliente.id, { importe: 20_000, medio: "efectivo" });
  await assert.rejects(anularFactura(admin, factura.id, { motivo, importeDevuelto: 80_000 }), devolucionRequerida(100_000));
  const resultado = await anularFactura(admin, factura.id, { motivo, importeDevuelto: 100_000 });
  assert.equal(resultado.anulacion?.importeDevuelto, 100_000);
  assert.equal((await obtenerFactura(factura.id)).anulacion?.importeDevuelto, 100_000);
  assert.deepEqual((await obtenerPago(admin, pago.id)).recibo, pago);
  assert.equal((await obtenerProducto(admin, producto.id)).existencia, 1);
  assert.deepEqual((await obtenerCuenta(admin, cliente.id, {})).movimientos.map(({ saldo }) => saldo),
    [100_000, 20_000, 0, 100_000, 0]);
  await assert.rejects(anularFactura(admin, factura.id, { motivo, importeDevuelto: 100_000 }), { code: "FACTURA_ANULADA" });
});

test("revierte la anulación y la devolución si falla el crédito final", async () => {
  const { cliente, producto, factura } = await emitir();
  await registrarPago(vendedor, cliente.id, { importe: 80_000, medio: "efectivo" });
  await assert.rejects(anularFactura(vendedor, factura.id, { motivo, importeDevuelto: 80_000 }), { status: 403 });
  await db.run(sql`CREATE TRIGGER fallar_credito BEFORE INSERT ON movimientos_cuenta
    WHEN NEW.tipo = 'credito' AND NEW.factura_id IS NOT NULL
    BEGIN SELECT RAISE(ABORT, 'Falla de prueba'); END`);
  try {
    await assert.rejects(anularFactura(admin, factura.id, { motivo, importeDevuelto: 80_000 }));
    assert.equal((await obtenerProducto(admin, producto.id)).existencia, 0);
    assert.equal((await obtenerFactura(factura.id)).estado, "emitida");
    assert.deepEqual((await obtenerCuenta(admin, cliente.id, {})).movimientos.map(({ saldo }) => saldo), [100_000, 20_000]);
  } finally {
    await db.run(sql`DROP TRIGGER fallar_credito`);
  }
  const resultado = await anularFactura(admin, factura.id, { motivo, importeDevuelto: 80_000 });
  assert.equal(resultado.anulacion?.importeDevuelto, 80_000);
  assert.equal((await obtenerCuenta(admin, cliente.id, {})).saldo, 0);
});
