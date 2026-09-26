import { ParametrosCreditoInvalidosError } from '../errors/errores';
import { aCentavos, aUnidades } from './dinero';
import { esPeriodicidad, Periodicidad, PERIODOS_POR_ANIO } from './periodicidad';

export interface CondicionesCredito {
  monto: number;
  tasaAnual: number;
  cuotas: number;
  periodicidad: Periodicidad;
}

export function validarCondiciones(c: CondicionesCredito): void {
  if (!Number.isFinite(c.monto) || c.monto <= 0) {
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
  return Math.round((montoCentavos * (i * factor)) / (factor - 1));
}

export function calcularCuotaNivelada(c: CondicionesCredito): number {
  return aUnidades(cuotaNiveladaEnCentavos(c));
}
