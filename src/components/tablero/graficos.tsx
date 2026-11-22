"use client";

import { ArcElement, CategoryScale, Chart, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { formasPago } from "@/components/ventas/facturas";
import { precioEnPesos } from "@/lib/formatos";
import type { Tablero } from "@/services/tablero";

Chart.register(ArcElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip);

// Colores de la libreta: azul de tapa, azul lavado y el ocre de la cuenta.
const coloresPago = {
  contado: "#1d3f8f",
  tarjeta: "#7f9bd6",
  cuenta_corriente: "#b8862b",
};

export function GraficoVentasDiarias({ ventasDiarias }: Pick<Tablero, "ventasDiarias">) {
  return (
    <div className="relative h-60 min-w-0">
      <Line
        aria-label="Importes de venta diarios de los últimos 30 días"
        data={{
          labels: ventasDiarias.map(({ fecha }) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`),
          datasets: [{
            label: "Ventas",
            data: ventasDiarias.map(({ importe }) => importe),
            borderColor: "#1d3f8f",
            backgroundColor: "#1d3f8f",
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
            x: { grid: { display: false }, ticks: { maxTicksLimit: 6, maxRotation: 0 } },
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
        <p className="rounded-lg bg-tinta-50 px-3 py-6 text-center text-sm text-muted-foreground">Sin importes por forma de pago este mes.</p>
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
