export function aCentavos(valor: FormDataEntryValue | undefined) {
  if (typeof valor !== "string") return NaN;
  const partes = /^(\d+)(?:[,.](\d{1,2}))?$/.exec(valor.trim());
  if (!partes) return NaN;
  const [, pesos, decimales = ""] = partes;
  // Concatenar los dígitos preserva los centavos sin multiplicar un decimal binario.
  return Number(pesos + decimales.padEnd(2, "0"));
}

export function aEntero(valor: FormDataEntryValue | undefined) {
  return typeof valor === "string" && /^\d+$/.test(valor.trim()) ? Number(valor) : NaN;
}

export function centavosComoDecimal(centavos: number) {
  const digitos = String(centavos).padStart(3, "0");
  return `${digitos.slice(0, -2)},${digitos.slice(-2)}`;
}
