import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { categorias, facturas, pagos } from "@/db/schema";
import type { UsuarioSesion } from "@/services/auth";
import { crearCliente } from "@/services/clientes";
import { anularFactura, confirmarVenta } from "@/services/facturas";
import { registrarPago } from "@/services/pagos";
import { crearCategoria, crearProducto } from "@/services/productos";

const catalogo = [
  ["Bebidas (demo)", [
    ["Agua mineral 500 ml", 1150], ["Jugo de naranja 1 l", 3200],
    ["Gaseosa cola 1,5 l", 4850], ["Soda 1,5 l", 2300],
    ["Agua saborizada 1,5 l", 2950], ["Jugo de manzana 1 l", 3150],
  ]],
  ["Almacén (demo)", [
    ["Arroz largo fino 1 kg", 2450], ["Fideos tirabuzón 500 g", 1970],
    ["Harina 000 1 kg", 1690], ["Aceite de girasol 900 ml", 3990],
    ["Lentejas 400 g", 2150], ["Tomate triturado 520 g", 1920],
  ]],
  ["Desayuno (demo)", [
    ["Yerba mate 500 g", 3950], ["Café molido 250 g", 7820],
    ["Té negro 25 saquitos", 1890], ["Dulce de leche 400 g", 3590],
    ["Galletitas de avena 200 g", 1980], ["Mermelada de frutilla 390 g", 3250],
  ]],
  ["Limpieza (demo)", [
    ["Detergente neutro 500 ml", 2450], ["Lavandina 1 l", 1590],
    ["Jabón líquido para ropa 800 ml", 4790], ["Limpiador de piso 900 ml", 3200],
    ["Esponja multiuso", 950], ["Bolsas de residuos x 10", 2450],
  ]],
  ["Higiene (demo)", [
    ["Jabón de tocador 90 g", 1530], ["Pasta dental 90 g", 3190],
    ["Shampoo neutro 350 ml", 6390], ["Papel higiénico x 4", 3690],
    ["Cepillo dental suave", 2150], ["Toallitas húmedas x 50", 2990],
  ]],
] as const;

const nombresClientes = [
  "Lucía Benítez", "Martín Ferreyra", "Sofía Álvarez", "Julián Rivero", "Abril Mendoza",
  "Tomás Luna", "Valentina Sosa", "Emilia Paredes", "Bruno Medina", "Camila Ríos",
] as const;
const ultimoClienteConPago = 3;
const importeUltimoPago = 192_000;
const observacionFinal = "Pago parcial de las compras de demostración.";
const dia = 86_400_000;

function documentoCliente(indice: number) {
  return String(99_990_001 + indice);
}

function cargaIncompleta(cause?: unknown) {
  return new Error(
    "La carga de demostración quedó incompleta o ya está en curso. Si terminó con error, restaurá la base anterior al seed o apuntá a una base de demostración nueva, ejecutá pnpm db:migrate y volvé a ejecutar pnpm db:seed.",
    { cause },
  );
}

export async function cargarDemo(admin: UsuarioSesion, vendedor: UsuarioSesion) {
  const [ultimoPago] = await db.select({ id: pagos.id }).from(pagos)
    .innerJoin(facturas, eq(facturas.clienteId, pagos.clienteId))
    .where(and(
      eq(facturas.clienteTipoDoc, "DNI"),
      eq(facturas.clienteNroDoc, documentoCliente(ultimoClienteConPago)),
      eq(pagos.importe, importeUltimoPago),
      eq(pagos.observacion, observacionFinal),
    )).limit(1);
  if (ultimoPago) return false;

  // La primera categoría reserva la carga: su nombre es único en la base.
  const [inicio] = await db.select({ id: categorias.id }).from(categorias)
    .where(eq(categorias.nombre, catalogo[0][0]));
  if (inicio) throw cargaIncompleta();

  try {
    const ahora = Date.now();
    const fechaCatalogo = new Date(ahora - 30 * dia);
    const productos: number[] = [];
    for (const [nombre, articulos] of catalogo) {
      const categoria = await crearCategoria(admin, { nombre });
      for (const [descripcion, precio] of articulos) {
        const indice = productos.length;
        const producto = await crearProducto(admin, {
          codigo: `DEMO-${String(indice + 1).padStart(3, "0")}`,
          descripcion,
          precio: precio * 100,
          categoriaId: categoria.id,
          stockInicial: indice === 0 ? 1 : indice < 4 ? 21 : 65 + (indice % 5) * 5,
          stockMinimo: indice < 4 ? 25 : 10,
        }, fechaCatalogo);
        productos.push(producto.id);
      }
    }

    const compradores: number[] = [];
    for (const [indice, nombre] of nombresClientes.entries()) {
      const cliente = await crearCliente(vendedor, {
        nombre,
        tipoDoc: "DNI",
        nroDoc: documentoCliente(indice),
        email: `cliente${indice + 1}@gestion.test`,
        cuentaCorriente: indice < 6,
        limiteCredito: indice < 6 && indice % 2 === 0 ? 25_000_000 : null,
      });
      compradores.push(cliente.id);
    }

    const cantidadFacturas = 51;
    for (let indice = 0; indice < cantidadFacturas; indice++) {
      const ultima = indice === cantidadFacturas - 1;
      const diasAtras = Math.floor((cantidadFacturas - 1 - indice) * 30 / cantidadFacturas);
      const aCuenta = indice % 5 === 0;
      const clienteId = aCuenta
        ? compradores[(indice / 5) % 6]
        : indice % 7 === 0 ? null : compradores[indice % compradores.length];
      const pago = aCuenta ? { forma: "cuenta_corriente" }
        : indice % 2 === 0 ? { forma: "contado" }
          : { forma: "tarjeta", tarjeta: { tipo: "debito", marca: "Visa", ultimos4: "0123" } };
      const factura = await confirmarVenta(indice % 2 === 0 ? vendedor : admin, {
        clienteId,
        pago,
        items: [
          { productoId: productos[1 + indice % 12], cantidad: 1 + indice % 3 },
          { productoId: productos[indice === 0 ? 0 : 13 + indice % 17], cantidad: 1 },
        ],
      }, new Date(ahora - diasAtras * dia));

      if (ultima) {
        await anularFactura(admin, factura.id, { motivo: "El cliente canceló la compra de demostración." });
      }
    }

    await registrarPago(vendedor, compradores[0], { importe: 175_000, medio: "efectivo" });
    await registrarPago(admin, compradores[2], { importe: 240_000, medio: "transferencia" });
    // El último pago confirma que todas las operaciones anteriores se completaron.
    await registrarPago(vendedor, compradores[ultimoClienteConPago], {
      importe: importeUltimoPago,
      medio: "tarjeta_debito",
      observacion: observacionFinal,
    });
    return true;
  } catch (error) {
    throw cargaIncompleta(error);
  }
}
