export const formasPago = {
  contado: "Contado",
  tarjeta: "Tarjeta",
  cuenta_corriente: "Cuenta corriente",
};

export const estadosFactura = {
  emitida: "Emitida",
  anulada: "Anulada",
};

const fechaArgentina = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function fechaFactura(fecha: string) {
  return fechaArgentina.format(new Date(fecha));
}
