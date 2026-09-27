import { aCentavos, aUnidades } from '@credito/domain';

/** Suma de montos en centavos para no acumular error de punto flotante. */
export const sumarMontos = (creditos: { monto: string }[]): number =>
  aUnidades(creditos.reduce((total, c) => total + aCentavos(Number(c.monto)), 0));
