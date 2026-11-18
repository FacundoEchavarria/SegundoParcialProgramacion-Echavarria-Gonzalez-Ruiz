"use client";

import { useEffect, useState, type ReactNode } from "react";
import { claseSecundaria } from "@/components/acceso/estilos";
import { AvisoError, Campo } from "@/components/acceso/formulario";

type Pagina<T> = { data: T[]; pageSize: number; total: number };

export function BusquedaVenta<T extends { id: number; activo: boolean }>({
  recurso, etiqueta, maxLength, resultado,
}: {
  recurso: "clientes" | "productos";
  etiqueta: string;
  maxLength: number;
  resultado: (registro: T, limpiar: () => void) => ReactNode;
}) {
  const [texto, setTexto] = useState("");
  const [pagina, setPagina] = useState(1);
  const [respuesta, setRespuesta] = useState<Pagina<T> | "error" | null>(null);
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
  }, [consulta, pagina, recurso]);

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
        onChange={(event) => cambiarTexto(event.currentTarget.value)} />
      {consulta && respuesta === null && <p role="status" className="text-sm text-muted-foreground">Buscando…</p>}
      {respuesta === "error" && <AvisoError error={{ message: "No se pudo realizar la búsqueda. Volvé a ingresar el texto." }} />}
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
              <button type="button" className={claseSecundaria} disabled={pagina === 1}
                onClick={() => cambiarPagina(pagina - 1)}>Anterior</button>
              <span>Página {pagina} de {ultima}</span>
              <button type="button" className={claseSecundaria} disabled={pagina >= ultima}
                onClick={() => cambiarPagina(pagina + 1)}>Siguiente</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
