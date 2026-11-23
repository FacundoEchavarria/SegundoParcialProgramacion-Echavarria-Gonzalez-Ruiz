"use client";

import { CircleCheck } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const AvisoContexto = createContext<(mensaje: string) => void>(() => {});

export function Avisos({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<{ mensaje: string } | null>(null);

  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(null), 8000);
    return () => clearTimeout(timer);
  }, [aviso]);

  return (
    <AvisoContexto.Provider value={(mensaje) => setAviso({ mensaje })}>
      {children}
      <div className="fixed inset-x-4 bottom-4 z-40 sm:left-auto sm:max-w-sm print:hidden" role="status">
        {aviso && (
          <div className="flex items-center gap-3 rounded-lg bg-exito-fondo px-3 py-2.5 text-sm font-medium text-exito shadow-lg">
            <CircleCheck aria-hidden className="size-4 shrink-0" />
            <span className="grow">{aviso.mensaje}</span>
            <Button type="button" size="sm" variant="outline" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </AvisoContexto.Provider>
  );
}

export function useAviso() {
  return useContext(AvisoContexto);
}
