"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { z } from "zod";
import { crearClienteAction, editarClienteAction } from "@/app/actions";
import { Dialogo } from "@/components/acceso/dialogo";
import { claseCampo } from "@/components/acceso/estilos";
import { AvisoError, Campo, useFormulario } from "@/components/acceso/formulario";
import { aCentavos, centavosComoDecimal } from "@/components/productos/campos";
import { altaClienteSchema, edicionClienteSchema } from "@/lib/schemas/clientes";
import type { crearCliente, obtenerCliente } from "@/services/clientes";

type Cliente = Awaited<ReturnType<typeof obtenerCliente>>;

function contactoOpcional(valor: FormDataEntryValue | undefined) {
  return typeof valor === "string" ? valor.trim() || null : valor;
}

function datosCliente(datos: Record<string, FormDataEntryValue>) {
  const { domicilio, telefono, email, limiteCredito, cuentaCorriente, ...identificacion } = datos;
  return {
    ...identificacion,
    domicilio: contactoOpcional(domicilio),
    telefono: contactoOpcional(telefono),
    email: contactoOpcional(email),
    cuentaCorriente: cuentaCorriente === "true",
    limiteCredito: typeof limiteCredito === "string" && limiteCredito.trim() === ""
      ? null
      : aCentavos(limiteCredito),
  };
}

const altaClienteForm = z.preprocess(datosCliente, altaClienteSchema);
const edicionClienteForm = z.preprocess(datosCliente, edicionClienteSchema);

export function FormularioCliente({ cliente, alGuardar }: {
  cliente?: Cliente;
  alGuardar?: (guardado: Awaited<ReturnType<typeof crearCliente>>) => void;
}) {
  const router = useRouter();
  const { enviar, enviando, error, errorCampo, limpiarError } = useFormulario();
  const idErrorTipoDoc = useId();
  const errorTipoDoc = errorCampo("tipoDoc");
  const titulo = cliente ? "Editar cliente" : "Nuevo cliente";
  const accion = cliente ? editarClienteAction.bind(null, cliente.id) : crearClienteAction;
  const esquema = cliente ? edicionClienteForm : altaClienteForm;

  return (
    <Dialogo etiqueta={titulo} titulo={titulo} ocupado={enviando} alCerrar={limpiarError}>
      {(cerrar) => (
        <form
          method="post"
          noValidate
          onSubmit={(event) =>
            enviar(event, esquema, accion, (guardado) => {
              cerrar();
              if (alGuardar) alGuardar(guardado);
              else router.refresh();
            }, cliente ? "Cliente actualizado." : "Cliente creado.")
          }
        >
          <fieldset className="grid min-w-0 gap-4" disabled={enviando}>
            <Campo etiqueta="Nombre o razón social" name="nombre" defaultValue={cliente?.nombre} required error={errorCampo("nombre")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid content-start gap-1.5 text-sm font-medium">
                Tipo de documento
                <select
                  className={claseCampo}
                  name="tipoDoc"
                  defaultValue={cliente?.tipoDoc ?? "DNI"}
                  aria-invalid={errorTipoDoc ? true : undefined}
                  aria-describedby={errorTipoDoc ? idErrorTipoDoc : undefined}
                >
                  <option value="DNI">DNI</option>
                  <option value="CUIT">CUIT</option>
                </select>
                {errorTipoDoc && <span id={idErrorTipoDoc} className="text-red-800">{errorTipoDoc}</span>}
              </label>
              <Campo
                etiqueta="Número de documento"
                name="nroDoc"
                inputMode="numeric"
                defaultValue={cliente?.nroDoc}
                required
                error={errorCampo("nroDoc")}
              />
            </div>
            <Campo etiqueta="Domicilio" name="domicilio" defaultValue={cliente?.domicilio ?? ""} error={errorCampo("domicilio")} />
            <Campo etiqueta="Teléfono" name="telefono" type="tel" defaultValue={cliente?.telefono ?? ""} error={errorCampo("telefono")} />
            <Campo etiqueta="Email" name="email" type="email" defaultValue={cliente?.email ?? ""} error={errorCampo("email")} />
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                className="size-4 accent-primary"
                type="checkbox"
                name="cuentaCorriente"
                value="true"
                defaultChecked={cliente?.cuentaCorriente}
              />
              Habilitar cuenta corriente
            </label>
            <Campo
              etiqueta="Límite de crédito en pesos (opcional)"
              name="limiteCredito"
              inputMode="decimal"
              placeholder="Ej. 10000,50"
              defaultValue={cliente?.limiteCredito == null ? "" : centavosComoDecimal(cliente.limiteCredito)}
              error={errorCampo("limiteCredito")}
            />
            <AvisoError error={error} />
            <div>
              <Button type="submit">
                {enviando ? "Guardando…" : cliente ? "Guardar cambios" : "Crear cliente"}
              </Button>
            </div>
          </fieldset>
        </form>
      )}
    </Dialogo>
  );
}

export function CambiarEstadoCliente({ cliente }: { cliente: Cliente }) {
  const router = useRouter();
  const { enviar, enviando, error, limpiarError } = useFormulario();
  const activo = !cliente.activo;
  const titulo = activo ? "Reactivar cliente" : "Desactivar cliente";
  const esquema = z.preprocess(() => ({ activo }), edicionClienteSchema);

  return (
    <Dialogo etiqueta={titulo} titulo={titulo} ocupado={enviando} alCerrar={limpiarError}>
      {(cerrar) => (
        <form
          className="grid gap-4"
          method="post"
          onSubmit={(event) =>
            enviar(event, esquema, editarClienteAction.bind(null, cliente.id), () => {
              cerrar();
              router.refresh();
            }, cliente.activo ? "Cliente desactivado." : "Cliente reactivado.")
          }
        >
          <p className="break-words">¿Querés {activo ? "reactivar" : "desactivar"} a {cliente.nombre}?</p>
          <AvisoError error={error} />
          <div>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : titulo}
            </Button>
          </div>
        </form>
      )}
    </Dialogo>
  );
}
