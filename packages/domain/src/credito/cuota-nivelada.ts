import { ParametrosCreditoInvalidosError } from '../errors/errores';
import { aCentavos, aUnidades } from './dinero';
import { esPeriodicidad, Periodicidad, PERIODOS_POR_ANIO } from './periodicidad';

export interface CondicionesCredito {
  monto: number;
  tasaAnual: number;
  cuotas: number;
  periodicidad: Periodicidad;
}

export const PLAZO_MAXIMO_ANIOS = 30;

export function validarCondiciones(c: CondicionesCredito): void {
  if (!Number.isFinite(c.monto) || aCentavos(c.monto) < 1) {
    throw new ParametrosCreditoInvalidosError('monto');
  }
  if (!Number.isInteger(c.cuotas) || c.cuotas < 1) {
    throw new ParametrosCreditoInvalidosError('cuotas');
  }
  if (!Number.isFinite(c.tasaAnual) || c.tasaAnual < 0 || c.tasaAnual > 100) {
    throw new ParametrosCreditoInvalidosError('tasaAnual');
  }
  if (!esPeriodicidad(c.periodicidad)) {
    throw new ParametrosCreditoInvalidosError('periodicidad');
  }
  if (c.cuotas / PERIODOS_POR_ANIO[c.periodicidad] > PLAZO_MAXIMO_ANIOS) {
    throw new ParametrosCreditoInvalidosError('cuotas');
  }
}

export function tasaPeriodica(tasaAnual: number, periodicidad: Periodicidad): number {
  return tasaAnual / 100 / PERIODOS_POR_ANIO[periodicidad];
}

export function cuotaNiveladaEnCentavos(c: CondicionesCredito): number {
  validarCondiciones(c);
  const montoCentavos = aCentavos(c.monto);
  const i = tasaPeriodica(c.tasaAnual, c.periodicidad);
  if (i === 0) {
    return Math.round(montoCentavos / c.cuotas);
  }
  const factor = Math.pow(1 + i, c.cuotas);
  const cuotaCentavos = Math.round((montoCentavos * (i * factor)) / (factor - 1));
  if (cuotaCentavos <= Math.round(montoCentavos * i)) {
    throw new ParametrosCreditoInvalidosError('tasaAnual');
  }
  return cuotaCentavos;
}

export function calcularCuotaNivelada(c: CondicionesCredito): number {
  return aUnidades(cuotaNiveladaEnCentavos(c));
}
