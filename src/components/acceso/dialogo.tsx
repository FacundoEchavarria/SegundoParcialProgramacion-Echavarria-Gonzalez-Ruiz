"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export function Dialogo({
  etiqueta,
  titulo,
  ocupado = false,
  alCerrar,
  children,
}: {
  etiqueta: string;
  titulo: string;
  ocupado?: boolean;
  alCerrar?: () => void;
  children: (cerrar: () => void) => ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  function cerrar() {
    setAbierto(false);
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setAbierto(true)} aria-haspopup="dialog">
        {etiqueta}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={idTitulo}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg
          overflow-y-auto rounded-xl border bg-white p-5 text-foreground shadow-lg backdrop:bg-black/45 sm:p-7"
        onCancel={(event) => {
          if (ocupado) event.preventDefault();
        }}
        onClose={() => {
          setAbierto(false);
          alCerrar?.();
        }}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <h2 id={idTitulo} className="text-xl font-semibold">{titulo}</h2>
          <Button type="button" variant="outline" onClick={cerrar} disabled={ocupado}>
            Cerrar
          </Button>
        </header>
        {abierto && children(cerrar)}
      </dialog>
    </>
  );
}
