"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { z } from "zod";
import { registrarPagoAction } from "@/app/actions";
import { Dialogo } from "@/components/acceso/dialogo";
import { claseCampo } from "@/components/acceso/estilos";
import { AvisoError, Campo, useFormulario } from "@/components/acceso/formulario";
import { aCentavos } from "@/components/productos/campos";
import { mediosPago, pagoSchema } from "@/lib/schemas/pagos";

const pagoFormulario = z.preprocess((datos: Record<string, FormDataEntryValue>) => ({
  ...datos,
  importe: aCentavos(datos.importe),
}), pagoSchema);

export function FormularioPago({ clienteId, deuda }: { clienteId: number; deuda: string }) {
  const router = useRouter();
  const { enviar, enviando, error, errorCampo, limpiarError } = useFormulario();
  const errorMedioId = useId();
  const errorMedio = errorCampo("medio");

  return (
    <Dialogo etiqueta="Registrar pago" titulo="Registrar pago" ocupado={enviando} alCerrar={limpiarError}>
      {(cerrar) => (
        <form method="post" noValidate onSubmit={(evento) =>
          enviar(evento, pagoFormulario, registrarPagoAction.bind(null, clienteId), (recibo) => {
            cerrar();
            router.push(`/pagos/${recibo.id}`);
          })
        }>
          <fieldset className="grid min-w-0 gap-4" disabled={enviando}>
            <p className="text-sm">Deuda actual <strong>{deuda}</strong></p>
            <Campo etiqueta="Importe en pesos" name="importe" inputMode="decimal"
              placeholder="Ej. 3000,50" required error={errorCampo("importe")} />
            <label className="grid gap-1.5 text-sm font-medium">
              Medio de pago
              <select className={claseCampo} name="medio" aria-invalid={Boolean(errorMedio)}
                aria-describedby={errorMedio ? errorMedioId : undefined}>
                {Object.entries(mediosPago).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>{etiqueta}</option>
                ))}
              </select>
              {errorMedio && <span id={errorMedioId} className="text-red-800">{errorMedio}</span>}
            </label>
            <Campo etiqueta="Observación (opcional)" name="observacion" error={errorCampo("observacion")} />
            <AvisoError error={error} />
            <div><Button type="submit">{enviando ? "Registrando…" : "Registrar pago"}</Button></div>
          </fieldset>
        </form>
      )}
    </Dialogo>
  );
}
