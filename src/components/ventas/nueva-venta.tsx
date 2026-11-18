"use client";

import { useState } from "react";
import { z } from "zod";
import { claseCampo, clasePrincipal, claseSecundaria } from "@/components/acceso/estilos";
import { AvisoError, Campo, useFormulario } from "@/components/acceso/formulario";
import { FormularioCliente } from "@/components/clientes/formularios";
import { aCentavos, aEntero } from "@/components/productos/campos";
import { Card } from "@/components/ui/card";
import type { ApiError } from "@/lib/api-error";
import { precioEnPesos } from "@/lib/formatos";
import { ventaSchema } from "@/lib/schemas/facturas";
import type { listarClientes } from "@/services/clientes";
import type { FacturaEmitida } from "@/services/facturas";
import type { listarProductos } from "@/services/productos";
import { BusquedaVenta } from "./busqueda";

type Cliente = Awaited<ReturnType<typeof listarClientes>>["data"][number];
type Producto = Awaited<ReturnType<typeof listarProductos>>["data"][number];
type FormaPago = z.infer<typeof ventaSchema>["pago"]["forma"];
type Renglon = { producto: Producto; cantidad: string };

export function NuevaVenta({ numeroEstimado }: { numeroEstimado: string }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [renglones, setRenglones] = useState<Renglon[]>([]);
  const [versionCatalogo, setVersionCatalogo] = useState(0);
  const [forma, setForma] = useState<FormaPago>("contado");
  const [recibido, setRecibido] = useState("");
  const [confirmada, setConfirmada] = useState<FacturaEmitida | null>(null);
  const { enviar, enviando, error, errorCampo, limpiarError } = useFormulario();

  const items = renglones.map(({ producto, cantidad }) => {
    const unidades = aEntero(cantidad);
    if (!Number.isSafeInteger(unidades) || unidades < 1) {
      return { producto, cantidad, unidades: 0, subtotal: null, error: "Ingresá una cantidad entera mayor que cero." };
    }
    return {
      producto, cantidad, unidades,
      subtotal: producto.precio * unidades,
      error: unidades > producto.existencia ? "Supera el stock disponible." : undefined,
    };
  });
  const total = items.reduce((suma, item) => suma + (item.subtotal ?? 0), 0);
  const cuentaHabilitada = cliente?.cuentaCorriente === true;
  const montoRecibido = recibido.trim() ? aCentavos(recibido) : undefined;
  const diferencia = (montoRecibido ?? total) - total;
  const puedeConfirmar = items.length > 0 && items.every((item) => !item.error);
  const credito = error?.details && "excedente" in error.details ? error.details : null;
  const errorCliente = errorCampo("clienteId");

  function elegirCliente(elegido: Cliente | null) {
    setCliente(elegido);
    if (!elegido?.cuentaCorriente && forma === "cuenta_corriente") setForma("contado");
    limpiarError();
  }

  function agregar(producto: Producto) {
    limpiarError();
    setRenglones((actuales) => {
      const anterior = actuales.find((item) => item.producto.id === producto.id);
      const unidades = aEntero(anterior?.cantidad);
      const cantidad = (Number.isSafeInteger(unidades) ? unidades : 0) + 1;
      if (cantidad > producto.existencia) return actuales;
      const nuevo = { producto, cantidad: String(cantidad) };
      return anterior ? actuales.map((item) => item === anterior ? nuevo : item) : [...actuales, nuevo];
    });
  }

  function cambiarCantidad(id: number, cantidad: string) {
    limpiarError();
    setRenglones((actuales) => actuales.map((renglon) => renglon.producto.id === id ? { ...renglon, cantidad } : renglon));
  }

  const esquema = z.preprocess((datos: Record<string, FormDataEntryValue>) => ({
    clienteId: cliente?.id ?? null,
    items: items.map(({ producto, unidades }) => ({ productoId: producto.id, cantidad: unidades })),
    pago: forma === "contado" ? { forma, montoRecibido }
      : forma === "tarjeta" ? { forma, tarjeta: { tipo: datos.tipo, marca: datos.marca, ultimos4: datos.ultimos4 } }
      : { forma },
  }), ventaSchema);

  async function confirmar(datos: unknown) {
    const response = await fetch("/api/facturas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    if (response.ok) return { ok: true as const, data: await response.json() as FacturaEmitida };

    const { error }: { error: ReturnType<ApiError["toJSON"]> } = await response.json();
    const detalles = error.details;
    if (error.code === "STOCK_INSUFICIENTE" && Array.isArray(detalles)) {
      setVersionCatalogo((version) => version + 1);
      setRenglones((actuales) => actuales.map((renglon) => {
        for (const detalle of detalles) {
          if ("productoId" in detalle && detalle.productoId === renglon.producto.id) {
            return { ...renglon, producto: { ...renglon.producto, existencia: detalle.disponible } };
          }
        }
        return renglon;
      }));
    }
    return { ok: false as const, error };
  }

  if (confirmada) {
    return (
      <section className="grid gap-6">
        <h1 className="text-3xl font-semibold tracking-tight" tabIndex={-1} ref={(titulo) => titulo?.focus()}>
          Venta confirmada
        </h1>
        <Card className="max-w-xl gap-4 border-t-4 border-t-primary p-5 sm:p-6">
          <dl className="grid gap-2 text-sm [&>div]:flex [&>div]:justify-between [&>div]:gap-3 [&_dd]:font-semibold [&_dd]:tabular-nums">
            <div><dt>Factura</dt><dd>{confirmada.numeroFormateado}</dd></div>
            <div><dt>Total</dt><dd>{precioEnPesos(confirmada.total)}</dd></div>
            {confirmada.pago.forma === "contado" && (
              <div><dt>Vuelto</dt><dd>{precioEnPesos(confirmada.pago.vuelto)}</dd></div>
            )}
            {confirmada.saldoCliente !== undefined && (
              <div><dt>Saldo del cliente</dt><dd>{precioEnPesos(confirmada.saldoCliente)}</dd></div>
            )}
          </dl>
          <div><button type="button" className={clasePrincipal} onClick={() => window.location.reload()}>Nueva venta</button></div>
        </Card>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Nueva venta</h1>
        <p className="text-sm text-muted-foreground">Próximo número estimado <span className="font-semibold tabular-nums">{numeroEstimado}</span></p>
      </header>

      <Card className="gap-4 p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Comprador</h2>
        <fieldset className="grid min-w-0 gap-4" disabled={enviando}>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background px-3 py-2">
            <div className="min-w-0 break-words">
              <p className="font-semibold">{cliente?.nombre ?? "Consumidor final"}</p>
              {cliente && <p className="text-sm text-muted-foreground">{cliente.tipoDoc} {cliente.nroDoc}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {cliente && <button type="button" className={claseSecundaria} onClick={() => elegirCliente(null)}>Usar consumidor final</button>}
              <FormularioCliente alGuardar={elegirCliente} />
            </div>
          </div>
          <BusquedaVenta<Cliente> recurso="clientes" etiqueta="Buscar por nombre o documento" maxLength={150}
            resultado={(persona, limpiar) => (
              <button type="button" className="flex w-full flex-wrap justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-background focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => { elegirCliente(persona); limpiar(); }}>
                <span className="font-medium break-words">{persona.nombre}</span>
                <span className="text-muted-foreground">{persona.tipoDoc} {persona.nroDoc}</span>
              </button>
            )}
          />
          {errorCliente && <p className="text-sm text-red-900">{errorCliente}</p>}
        </fieldset>
      </Card>

      <Card className="gap-4 p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Ítems</h2>
        <fieldset className="grid min-w-0 gap-4" disabled={enviando}>
          <BusquedaVenta<Producto> key={versionCatalogo} recurso="productos" etiqueta="Buscar por código o descripción" maxLength={100}
            resultado={(producto) => {
              const renglon = items.find((item) => item.producto.id === producto.id);
              return (
                <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0 break-words">
                    <p className="font-medium">{producto.descripcion}</p>
                    <p className="text-muted-foreground">{producto.codigo} · {precioEnPesos(producto.precio)} · {producto.existencia} disponibles</p>
                  </div>
                  <button type="button" className={claseSecundaria} aria-label={`Agregar ${producto.descripcion}`}
                    disabled={(renglon?.unidades ?? 0) >= producto.existencia} onClick={() => agregar(producto)}>
                    Agregar
                  </button>
                </div>
              );
            }}
          />
          {renglones.length === 0 ? (
            <p className="rounded-lg bg-background px-3 py-4 text-sm text-muted-foreground">Agregá al menos un producto para confirmar la venta.</p>
          ) : (
            <div className="overflow-x-auto">
              <table aria-label="Ítems de la venta" className="w-full text-left text-sm">
                <thead className="border-b bg-background text-muted-foreground [&_th]:px-3 [&_th]:py-2">
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">Cantidad</th>
                    <th scope="col" className="text-right">Precio unitario</th>
                    <th scope="col" className="text-right">Subtotal</th>
                    <th scope="col"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y [&_td]:px-3 [&_td]:py-3">
                  {items.map(({ producto, cantidad, subtotal, error: errorCantidad }, indice) => (
                    <tr key={producto.id}>
                      <td className="min-w-32">
                        <p className="font-medium break-words">{producto.descripcion}</p>
                        <p className="text-muted-foreground">{producto.codigo} · {producto.existencia} disponibles</p>
                      </td>
                      <td className="w-36 min-w-24">
                        <label className="grid gap-1.5">
                          <span className="sr-only">Cantidad de {producto.descripcion}</span>
                          <input className={claseCampo} type="number" min={1} max={producto.existencia} step={1}
                            aria-invalid={Boolean(errorCantidad ?? errorCampo(`items.${indice}.cantidad`))}
                            aria-describedby={`cantidad-${producto.id}`}
                            value={cantidad} onChange={(event) => cambiarCantidad(producto.id, event.currentTarget.value)} />
                        </label>
                        <p id={`cantidad-${producto.id}`} className="text-xs text-red-900">
                          {errorCantidad ?? errorCampo(`items.${indice}.cantidad`)}
                        </p>
                      </td>
                      <td className="text-right whitespace-nowrap tabular-nums">{precioEnPesos(producto.precio)}</td>
                      <td className="text-right font-semibold whitespace-nowrap tabular-nums">{subtotal === null ? "—" : precioEnPesos(subtotal)}</td>
                      <td className="text-right">
                        <button type="button" className={claseSecundaria} aria-label={`Quitar ${producto.descripcion}`} onClick={() => {
                          setRenglones((actuales) => actuales.filter((item) => item.producto.id !== producto.id));
                          limpiarError();
                        }}>Quitar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </fieldset>
      </Card>

      <Card className="gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">Forma de pago</h2>
          <output className="text-2xl font-semibold tabular-nums">Total {precioEnPesos(total)}</output>
        </div>
        <form method="post" noValidate onSubmit={(event) => {
          event.preventDefault();
          if (!enviando && puedeConfirmar) enviar(event, esquema, confirmar, setConfirmada);
        }}>
          <fieldset disabled={enviando} className="grid min-w-0 gap-4">
            <label className="grid max-w-xs gap-1.5 text-sm font-medium">
              Forma de pago
              <select className={claseCampo} value={forma} onChange={(event) => {
                setForma(event.currentTarget.value as FormaPago);
                limpiarError();
              }}>
                <option value="contado">Contado</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="cuenta_corriente" disabled={!cuentaHabilitada}>Cuenta corriente</option>
              </select>
            </label>
            {forma === "contado" && (
              <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
                <Campo etiqueta="Monto recibido en pesos" inputMode="decimal" value={recibido} placeholder="Importe exacto"
                  error={errorCampo("pago.montoRecibido")} onChange={(event) => { setRecibido(event.currentTarget.value); limpiarError(); }} />
                {Number.isSafeInteger(diferencia) && (
                  <output className="pb-2 text-sm font-medium">
                    {diferencia >= 0 ? "Vuelto" : "Faltan"} {precioEnPesos(Math.abs(diferencia))}
                  </output>
                )}
              </div>
            )}
            {forma === "tarjeta" && (
              <div className="grid gap-4 sm:grid-cols-3" onChange={limpiarError}>
                <label className="grid gap-1.5 text-sm font-medium">
                  Tipo de tarjeta
                  <select className={claseCampo} name="tipo" defaultValue="debito">
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                  </select>
                </label>
                <Campo etiqueta="Marca" name="marca" maxLength={40} required error={errorCampo("pago.tarjeta.marca")} />
                <Campo etiqueta="Últimos cuatro dígitos" name="ultimos4" inputMode="numeric" maxLength={4}
                  autoComplete="off" required error={errorCampo("pago.tarjeta.ultimos4")} />
              </div>
            )}
            {forma === "cuenta_corriente" && cliente && (
              <p className="text-sm text-muted-foreground">
                Saldo actual {precioEnPesos(credito?.saldoActual ?? cliente.saldo)}
                {credito ? ` · Límite ${precioEnPesos(credito.limite)} · Excedente ${precioEnPesos(credito.excedente)}`
                  : cliente.disponible === null ? " · Sin límite de crédito" : ` · Crédito disponible ${precioEnPesos(cliente.disponible)}`}
              </p>
            )}
            <AvisoError error={error} />
            <div>
              <button className={clasePrincipal} disabled={enviando || !puedeConfirmar}>
                {enviando ? "Confirmando…" : "Confirmar venta"}
              </button>
            </div>
          </fieldset>
        </form>
      </Card>
    </section>
  );
}
