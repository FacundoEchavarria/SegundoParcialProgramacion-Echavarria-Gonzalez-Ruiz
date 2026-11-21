const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const fechaHoraArgentina = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function formatearFechaHora(fecha: string) {
  return fechaHoraArgentina.format(new Date(fecha));
}

export function formatearDia(fecha: string, incluirAnio = true) {
  const [anio, mes, dia] = fecha.split("-");
  return incluirAnio ? `${dia}/${mes}/${anio}` : `${dia}/${mes}`;
}

export function precioEnPesos(centavos: number) {
  const absoluto = Math.abs(centavos);
  const fraccion = absoluto % 100;
  const pesos = (absoluto - fraccion) / 100;
  const importe = moneda.formatToParts(pesos)
    .map(({ type, value }) => type === "fraction" ? String(fraccion).padStart(2, "0") : value)
    .join("");
  return centavos < 0 ? `-${importe}` : importe;
}

export function formatearNumeroFactura(puntoVenta: number, numero: number) {
  return `${String(puntoVenta).padStart(4, "0")}-${String(numero).padStart(8, "0")}`;
}
