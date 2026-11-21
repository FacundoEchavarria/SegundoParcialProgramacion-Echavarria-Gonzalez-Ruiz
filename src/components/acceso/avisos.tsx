"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
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
          <Alert variant="success" role="presentation" className="flex items-center gap-3 shadow-lg">
            <span className="grow">{aviso.mensaje}</span>
            <Button variant="outline" onClick={() => setAviso(null)} aria-label="Cerrar aviso">Cerrar</Button>
          </Alert>
        )}
      </div>
    </AvisoContexto.Provider>
  );
}

export function useAviso() {
  return useContext(AvisoContexto);
}
