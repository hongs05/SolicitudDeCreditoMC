export const aCentavos = (monto: number): number => Math.round(monto * 100);

export const aUnidades = (centavos: number): number => centavos / 100;
