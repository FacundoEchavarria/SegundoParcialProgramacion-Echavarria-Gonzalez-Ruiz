"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState, type ReactNode } from "react";
import { AvisoError, Campo } from "@/components/acceso/formulario";

type Pagina<T> = { data: T[]; pageSize: number; total: number };

export function BusquedaVenta<T extends { id: number; activo: boolean }>({
  recurso, etiqueta, maxLength, resultado, alEnter,
}: {
  recurso: "clientes" | "productos";
  etiqueta: string;
  maxLength: number;
  resultado: (registro: T, limpiar: () => void) => ReactNode;
  alEnter?: (registros: T[]) => void;
}) {
  const [texto, setTexto] = useState("");
  const [pagina, setPagina] = useState(1);
  const [respuesta, setRespuesta] = useState<Pagina<T> | "error" | null>(null);
  const [intento, setIntento] = useState(0);
  const consulta = texto.trim();

  useEffect(() => {
    if (!consulta) return;
    const controlador = new AbortController();
    const espera = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: consulta, page: String(pagina) });
        const response = await fetch(`/api/${recurso}?${params}`, { signal: controlador.signal });
        if (!response.ok) throw new Error("Búsqueda fallida");
        const datos: Pagina<T> = await response.json();
        if (!controlador.signal.aborted) setRespuesta(datos);
      } catch {
        if (!controlador.signal.aborted) setRespuesta("error");
      }
    }, 200);

    return () => {
      clearTimeout(espera);
      controlador.abort();
    };
  }, [consulta, pagina, recurso, intento]);

  function cambiarTexto(nuevo: string) {
    setTexto(nuevo);
    if (nuevo.trim() === consulta) return;
    setPagina(1);
    setRespuesta(null);
  }

  function cambiarPagina(nueva: number) {
    setPagina(nueva);
    setRespuesta(null);
  }

  const activos = respuesta && respuesta !== "error" ? respuesta.data.filter((registro) => registro.activo) : [];
  const ultima = respuesta && respuesta !== "error" ? Math.max(1, Math.ceil(respuesta.total / respuesta.pageSize)) : 1;

  return (
    <div className="grid gap-2">
      <Campo etiqueta={etiqueta} type="search" value={texto} maxLength={maxLength}
        onChange={(event) => cambiarTexto(event.currentTarget.value)}
        onKeyDown={alEnter && ((event) => {
          if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
          event.preventDefault();
          if (!event.repeat) alEnter(activos);
        })} />
      {consulta && respuesta === null && <p role="status" className="text-sm text-muted-foreground">Buscando…</p>}
      {respuesta === "error" && (
        <div className="grid gap-2">
          <AvisoError error={{ message: "No se pudo realizar la búsqueda." }} />
          <Button variant="outline" className="w-fit" onClick={() => {
            setRespuesta(null);
            setIntento((anterior) => anterior + 1);
          }}>Reintentar</Button>
        </div>
      )}
      {respuesta && respuesta !== "error" && (
        <>
          {activos.length ? (
            <ul className="divide-y rounded-lg border">
              {activos.map((registro) => <li key={registro.id}>{resultado(registro, () => cambiarTexto(""))}</li>)}
            </ul>
          ) : (
            <p role="status" className="text-sm text-muted-foreground">
              {ultima > 1 ? `No hay ${recurso} activos en esta página.` : `No se encontraron ${recurso} activos.`}
            </p>
          )}
          {ultima > 1 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Button type="button" variant="outline" disabled={pagina === 1}
                onClick={() => cambiarPagina(pagina - 1)}>Anterior</Button>
              <span>Página {pagina} de {ultima}</span>
              <Button type="button" variant="outline" disabled={pagina >= ultima}
                onClick={() => cambiarPagina(pagina + 1)}>Siguiente</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
