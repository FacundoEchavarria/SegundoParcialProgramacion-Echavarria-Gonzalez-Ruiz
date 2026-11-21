"use client";

import { ArcElement, CategoryScale, Chart, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { formasPago } from "@/components/ventas/facturas";
import { formatearDia, precioEnPesos } from "@/lib/formatos";
import type { Tablero } from "@/services/tablero";

Chart.register(ArcElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip);

const coloresPago = {
  contado: "#205741",
  tarjeta: "#30738a",
  cuenta_corriente: "#b07830",
};

export function GraficoVentasDiarias({ ventasDiarias }: Pick<Tablero, "ventasDiarias">) {
  return (
    <div className="relative h-60 min-w-0">
      <Line
        aria-label="Importes de venta diarios de los últimos 30 días"
        data={{
          labels: ventasDiarias.map(({ fecha }) => formatearDia(fecha)),
          datasets: [{
            label: "Ventas",
            data: ventasDiarias.map(({ importe }) => importe),
            borderColor: "#205741",
            backgroundColor: "#205741",
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          scales: {
            x: { grid: { display: false }, ticks: {
              maxTicksLimit: 6,
              maxRotation: 0,
              callback: (indice) => formatearDia(ventasDiarias[Number(indice)].fecha, false),
            } },
            y: {
              beginAtZero: true,
              suggestedMax: 100,
              ticks: {
                precision: 0,
                maxTicksLimit: 6,
                callback: (valor) => precioEnPesos(Number(valor)),
              },
            },
          },
          plugins: {
            tooltip: { callbacks: { label: ({ parsed }) => precioEnPesos(parsed.y ?? 0) } },
          },
        }}
      />
    </div>
  );
}

export function GraficoFormasDePago({ porFormaDePago }: Pick<Tablero, "porFormaDePago">) {
  return (
    <>
      {porFormaDePago.some(({ importe }) => importe > 0) ? (
        <div className="relative h-44 min-w-0">
          <Doughnut
            aria-label="Distribución de los importes del mes por forma de pago"
            data={{
              labels: porFormaDePago.map(({ forma }) => formasPago[forma]),
              datasets: [{
                data: porFormaDePago.map(({ importe }) => importe),
                backgroundColor: porFormaDePago.map(({ forma }) => coloresPago[forma]),
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                tooltip: { callbacks: { label: ({ label, parsed }) => `${label}: ${precioEnPesos(parsed)}` } },
              },
            }}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin importes por forma de pago este mes.</p>
      )}
      {porFormaDePago.length > 0 && (
        <ul className="grid gap-2 text-sm" aria-label="Importes por forma de pago">
          {porFormaDePago.map(({ forma, importe }) => (
            <li key={forma} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" aria-hidden="true" style={{ backgroundColor: coloresPago[forma] }} />
                {formasPago[forma]}
              </span>
              <span className="font-medium tabular-nums">{precioEnPesos(importe)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
