import { aCentavos, aUnidades } from '@credito/domain';
import type { CuotaResponse } from '../../shared/api/tipos';

export interface TotalesPlan { capital: number; interes: number; valorCuota: number }

/** Totales de la tabla, sumados en centavos. El capital total debe coincidir con el monto del crédito. */
export function totalesPlan(cuotas: CuotaResponse[]): TotalesPlan {
  const suma = (campo: keyof TotalesPlan) => aUnidades(cuotas.reduce((t, c) => t + aCentavos(Number(c[campo])), 0));
  return { capital: suma('capital'), interes: suma('interes'), valorCuota: suma('valorCuota') };
}

/** Primera cuota que vence hoy o después; `undefined` si el plan ya terminó. */
export const proximaCuota = (cuotas: CuotaResponse[], hoy: string): CuotaResponse | undefined =>
  cuotas.find((c) => c.fechaVencimiento >= hoy);
