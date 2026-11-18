const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

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
