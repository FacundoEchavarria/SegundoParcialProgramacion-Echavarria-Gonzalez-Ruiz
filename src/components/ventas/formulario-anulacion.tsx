"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";
import { anularFacturaAction } from "@/app/actions";
import { Dialogo } from "@/components/acceso/dialogo";
import { claseCampo } from "@/components/acceso/estilos";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AvisoError, useFormulario } from "@/components/acceso/formulario";
import { precioEnPesos } from "@/lib/formatos";
import { anulacionSchema } from "@/lib/schemas/facturas";

export function FormularioAnulacion({ facturaId, numero }: { facturaId: number; numero: string }) {
  const router = useRouter();
  const { enviar, enviando, error, errorCampo, limpiarError } = useFormulario();
  const errorMotivo = errorCampo("motivo");
  const idError = useId();
  const importe = error?.code === "DEVOLUCION_REQUERIDA" && error.details && "importeDevuelto" in error.details
    ? error.details.importeDevuelto : 0;
  const esquema = anulacionSchema.transform(({ motivo }) => ({
    motivo,
    ...(importe > 0 ? { importeDevuelto: importe } : {}),
  }));

  return (
    <Dialogo etiqueta="Anular factura" titulo={`Anular factura ${numero}`} ocupado={enviando} alCerrar={limpiarError}>
      {(cerrar) => (
        <form method="post" noValidate onSubmit={(evento) =>
          enviar(evento, esquema, anularFacturaAction.bind(null, facturaId), () => {
            cerrar();
            router.refresh();
          }, importe > 0 ? "Factura anulada y devolución registrada." : "Factura anulada.")
        }>
          <fieldset className="grid min-w-0 gap-4" disabled={enviando}>
            <p className="text-sm text-muted-foreground">
              Se devolverán los productos al stock y, si la venta fue en cuenta corriente, se acreditará el importe al cliente.
            </p>
            <Label className="grid gap-1.5">
              Motivo de anulación
              <textarea className={claseCampo} name="motivo" rows={3} maxLength={500} required
                aria-invalid={Boolean(errorMotivo)} aria-describedby={errorMotivo ? idError : undefined}
                onChange={limpiarError} />
              {errorMotivo && <span id={idError} className="text-xs font-medium text-peligro">{errorMotivo}</span>}
            </Label>
            <AvisoError error={error} />
            {importe > 0 && (
              <p className="rounded-lg border bg-tapa-clara px-3 py-2 text-sm">
                Devolución de caja: <strong>{precioEnPesos(importe)}</strong>.
                Entregá el importe al cliente cuando se confirme la anulación.
              </p>
            )}
            <div>
              <Button type="submit" variant="destructive">
                {enviando ? "Anulando…" : importe > 0 ? "Anular y registrar devolución" : "Confirmar anulación"}
              </Button>
            </div>
          </fieldset>
        </form>
      )}
    </Dialogo>
  );
}
