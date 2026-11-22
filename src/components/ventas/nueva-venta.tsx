"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { CircleCheck, Plus, Trash2, UserRound } from "lucide-react";
import { z } from "zod";
import { EncabezadoPagina, Panel } from "@/components/pagina";
import { claseCampo } from "@/components/acceso/estilos";
import { AvisoError, Campo, useFormulario } from "@/components/acceso/formulario";
import { FormularioCliente } from "@/components/clientes/formularios";
import { Fila, Grilla, Pila, Texto, Titulo } from "@/components/maquetacion";
import { aCentavos, aEntero } from "@/components/productos/campos";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ApiError } from "@/lib/api-error";
import { precioEnPesos } from "@/lib/formatos";
import { cn } from "@/lib/utils";
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
  const idFormulario = useId();
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
      <Pila gap="lg" className="max-w-xl">
        <Fila gap="sm">
          <CircleCheck aria-hidden className="size-6 text-exito" />
          <Titulo tabIndex={-1} ref={(titulo: HTMLHeadingElement | null) => titulo?.focus()}>Venta confirmada</Titulo>
        </Fila>
        <LaCuenta>
          <Pila as="dl" gap="xs" className="gap-0">
            <Renglon etiqueta="Factura" valor={confirmada.numeroFormateado} />
            <Total importe={confirmada.total} />
            {confirmada.pago.forma === "contado" && (
              <Renglon etiqueta="Vuelto" valor={precioEnPesos(confirmada.pago.vuelto)} />
            )}
            {confirmada.saldoCliente !== undefined && (
              <Renglon etiqueta="Saldo del cliente" valor={precioEnPesos(confirmada.saldoCliente)} />
            )}
          </Pila>
          <Fila className="mt-6">
            <Button asChild><Link href={`/ventas/${confirmada.id}`} prefetch={false}>Ver factura</Link></Button>
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>Nueva venta</Button>
          </Fila>
        </LaCuenta>
      </Pila>
    );
  }

  return (
    <Pila gap="lg">
      <EncabezadoPagina titulo="Nueva venta"
        descripcion={<>Próximo número estimado <span className="font-semibold text-foreground">{numeroEstimado}</span></>} />

      <Grilla gap="lg" className="items-start xl:grid-cols-[minmax(0,1fr)_23rem]">
        <Pila gap="md">
          <Bloque numero={1} titulo="Comprador">
            <fieldset className="grid min-w-0 gap-4" disabled={enviando}>
              <Fila gap="md" className="justify-between rounded-lg bg-tinta-50 px-3 py-2.5">
                <Fila gap="sm" className="min-w-0">
                  <UserRound aria-hidden className="size-5 shrink-0 text-tapa" />
                  <Pila gap="xs" className="min-w-0 gap-0 break-words">
                    <Texto className="font-semibold">{cliente?.nombre ?? "Consumidor final"}</Texto>
                    {cliente && <Texto tono="secundario" className="text-xs">{cliente.tipoDoc} {cliente.nroDoc}</Texto>}
                  </Pila>
                </Fila>
                <Fila>
                  {cliente && <Button type="button" variant="outline" onClick={() => elegirCliente(null)}>Usar consumidor final</Button>}
                  <FormularioCliente alGuardar={elegirCliente} />
                </Fila>
              </Fila>
              <BusquedaVenta<Cliente> recurso="clientes" etiqueta="Buscar por nombre o documento" maxLength={150}
                resultado={(persona, limpiar) => (
                  <button type="button" className="flex w-full flex-wrap justify-between gap-2 px-3 py-2.5 text-left text-sm outline-none"
                    onClick={() => { elegirCliente(persona); limpiar(); }}>
                    <span className="font-medium break-words">{persona.nombre}</span>
                    <span className="text-muted-foreground">{persona.tipoDoc} {persona.nroDoc}</span>
                  </button>
                )}
              />
              {errorCliente && <Texto tono="peligro" className="text-xs font-medium">{errorCliente}</Texto>}
            </fieldset>
          </Bloque>

          <Bloque numero={2} titulo="Ítems">
            <fieldset className="grid min-w-0 gap-4" disabled={enviando}>
              <BusquedaVenta<Producto> key={versionCatalogo} recurso="productos" etiqueta="Buscar por código o descripción" maxLength={100}
                resultado={(producto) => {
                  const renglon = items.find((item) => item.producto.id === producto.id);
                  return (
                    <Fila gap="md" className="justify-between px-3 py-2.5">
                      <Pila gap="xs" className="min-w-0 gap-0 break-words">
                        <Texto className="font-medium">{producto.descripcion}</Texto>
                        <Texto tono="secundario" className="text-xs">{producto.codigo} · {precioEnPesos(producto.precio)} · {producto.existencia} disponibles</Texto>
                      </Pila>
                      <Button type="button" variant="outline" size="sm" aria-label={`Agregar ${producto.descripcion}`}
                        disabled={(renglon?.unidades ?? 0) >= producto.existencia} onClick={() => agregar(producto)}>
                        <Plus aria-hidden />Agregar
                        <kbd aria-hidden className="hidden rounded border border-tinta-300 px-1 text-xs font-medium text-tapa group-has-[:focus-visible]/resultado:inline">Enter</kbd>
                      </Button>
                    </Fila>
                  );
                }}
              />
              {renglones.length === 0 ? (
                <Texto tono="secundario" className="rounded-lg bg-tinta-50 px-3 py-4">Agregá al menos un producto para confirmar la venta.</Texto>
              ) : (
                <Table aria-label="Ítems de la venta">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead className="text-right">Precio unitario</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead><span className="sr-only">Acciones</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(({ producto, cantidad, subtotal, error: errorCantidad }, indice) => (
                      <TableRow key={producto.id} className="align-top">
                        <TableCell className="min-w-32 whitespace-normal">
                          <Texto className="font-medium break-words">{producto.descripcion}</Texto>
                          <Texto tono="secundario" className="text-xs">{producto.codigo} · {producto.existencia} disponibles</Texto>
                        </TableCell>
                        <TableCell className="w-32 min-w-24 whitespace-normal">
                          <Label className="grid gap-1.5">
                            <span className="sr-only">Cantidad de {producto.descripcion}</span>
                            <input className={claseCampo} type="number" min={1} max={producto.existencia} step={1}
                              aria-invalid={Boolean(errorCantidad ?? errorCampo(`items.${indice}.cantidad`))}
                              aria-describedby={`cantidad-${producto.id}`}
                              value={cantidad} onChange={(event) => cambiarCantidad(producto.id, event.currentTarget.value)} />
                          </Label>
                          <Texto as="span" id={`cantidad-${producto.id}`} tono="peligro" className="text-xs font-medium">
                            {errorCantidad ?? errorCampo(`items.${indice}.cantidad`)}
                          </Texto>
                        </TableCell>
                        <TableCell className="pt-4 text-right">{precioEnPesos(producto.precio)}</TableCell>
                        <TableCell className="pt-4 text-right font-semibold">{subtotal === null ? "—" : precioEnPesos(subtotal)}</TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="ghost" size="icon" className="text-tinta-500 hover:text-peligro"
                            aria-label={`Quitar ${producto.descripcion}`} onClick={() => {
                              setRenglones((actuales) => actuales.filter((item) => item.producto.id !== producto.id));
                              limpiarError();
                            }}><Trash2 aria-hidden /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </fieldset>
          </Bloque>

          <Bloque numero={3} titulo="Forma de pago">
            <form id={idFormulario} method="post" noValidate onSubmit={(event) => {
              event.preventDefault();
              if (!enviando && puedeConfirmar) enviar(event, esquema, confirmar, setConfirmada);
            }}>
              <fieldset disabled={enviando} className="grid min-w-0 gap-4">
                <Label className="grid max-w-xs gap-1.5">
                  Forma de pago
                  <select className={claseCampo} value={forma} onChange={(event) => {
                    setForma(event.currentTarget.value as FormaPago);
                    limpiarError();
                  }}>
                    <option value="contado">Contado</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="cuenta_corriente" disabled={!cuentaHabilitada}>Cuenta corriente</option>
                  </select>
                </Label>
                {forma === "contado" && (
                  <Fila gap="md" className="items-end">
                    <Campo etiqueta="Monto recibido en pesos" inputMode="decimal" value={recibido} placeholder="Importe exacto"
                      error={errorCampo("pago.montoRecibido")} onChange={(event) => { setRecibido(event.currentTarget.value); limpiarError(); }} />
                    {Number.isSafeInteger(diferencia) && (
                      <output className="pb-2.5 font-semibold">
                        {diferencia >= 0 ? "Vuelto" : "Faltan"} {precioEnPesos(Math.abs(diferencia))}
                      </output>
                    )}
                  </Fila>
                )}
                {forma === "tarjeta" && (
                  <Grilla className="sm:grid-cols-3" onChange={limpiarError}>
                    <Label className="grid content-start gap-1.5">
                      Tipo de tarjeta
                      <select className={claseCampo} name="tipo" defaultValue="debito">
                        <option value="debito">Débito</option>
                        <option value="credito">Crédito</option>
                      </select>
                    </Label>
                    <Campo etiqueta="Marca" name="marca" maxLength={40} required error={errorCampo("pago.tarjeta.marca")} />
                    <Campo etiqueta="Últimos cuatro dígitos" name="ultimos4" inputMode="numeric" maxLength={4}
                      autoComplete="off" required error={errorCampo("pago.tarjeta.ultimos4")} />
                  </Grilla>
                )}
                {forma === "cuenta_corriente" && cliente && (
                  <Texto tono="secundario">
                    Saldo actual {precioEnPesos(credito?.saldoActual ?? cliente.saldo)}
                    {credito ? ` · Límite ${precioEnPesos(credito.limite)} · Excedente ${precioEnPesos(credito.excedente)}`
                      : cliente.disponible === null ? " · Sin límite de crédito" : ` · Crédito disponible ${precioEnPesos(cliente.disponible)}`}
                  </Texto>
                )}
              </fieldset>
            </form>
          </Bloque>
        </Pila>

        <LaCuenta className="xl:sticky xl:top-24">
          <Titulo nivel={3} className="leading-8">La cuenta</Titulo>
          {items.length === 0 ? (
            <Texto tono="secundario" className="leading-8">Todavía no agregaste productos.</Texto>
          ) : (
            <Pila as="ul" gap="xs" className="gap-0" aria-label="Detalle de la cuenta">
              {items.map(({ producto, unidades, subtotal }) => (
                <Fila as="li" key={producto.id} gap="md" className="min-h-8 flex-nowrap justify-between">
                  <span className="min-w-0 truncate">{producto.descripcion} × {unidades || "—"}</span>
                  <span className="shrink-0">{subtotal === null ? "—" : precioEnPesos(subtotal)}</span>
                </Fila>
              ))}
            </Pila>
          )}
          <Total importe={total} />
          <Pila gap="sm" className="mt-6">
            <AvisoError error={error} />
            <Button type="submit" form={idFormulario} size="lg" className="h-11 w-full" disabled={enviando || !puedeConfirmar}>
              {enviando ? "Confirmando…" : "Confirmar venta"}
            </Button>
          </Pila>
        </LaCuenta>
      </Grilla>
    </Pila>
  );
}

function Bloque({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <Panel aria-label={titulo} className="overflow-hidden">
      <Fila as="h2" gap="sm" className="border-b bg-tapa-clara px-5 py-3 text-xs font-semibold tracking-[0.08em] text-tapa uppercase sm:px-6">
        <span aria-hidden className="grid size-5 place-items-center rounded-full bg-tapa text-xs text-white">{numero}</span>
        {titulo}
      </Fila>
      <div className="p-5 sm:p-6">{children}</div>
    </Panel>
  );
}

// La cuenta del almacén: papel con renglón tenue y el doble margen rojo a la izquierda.
function LaCuenta({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Panel className={cn("relative overflow-hidden bg-[repeating-linear-gradient(to_bottom,transparent_0_31px,var(--color-tinta-100)_31px_32px)] bg-origin-content py-5 pr-5 pl-11", className)}>
      <span aria-hidden className="absolute inset-y-0 left-6 w-[5px] border-x border-margen/80" />
      {children}
    </Panel>
  );
}

function Renglon({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <Fila gap="md" className="min-h-8 justify-between">
      <dt>{etiqueta}</dt>
      <dd className="font-semibold">{valor}</dd>
    </Fila>
  );
}

// El total se subraya dos veces, como en la libreta; la clave lo vuelve a subrayar cuando cambia.
function Total({ importe }: { importe: number }) {
  return (
    <Fila gap="md" className="mt-3 items-end justify-between bg-card py-1">
      <span className="font-semibold">Total</span>
      <output key={importe} aria-live="polite" className="subrayado-doble angosta pb-2 text-3xl font-bold tracking-tight text-tapa">
        {precioEnPesos(importe)}
      </output>
    </Fila>
  );
}
