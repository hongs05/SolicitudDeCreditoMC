import {
  aCentavos, aUnidades, calcularCuotaNivelada, calcularEdad, EDAD_MAXIMA,
  esFechaValida, esPeriodicidad, generarPlanAmortizacion,
} from '@credito/domain';
import { PATRON_DECIMAL, type ValoresSolicitud } from './esquema';

export interface Resumen {
  edad: number | null;
  edadExcedida: boolean;
  plan: { cuota: number; totalPagar: number; totalIntereses: number } | null;
}

function calcularPlan(v: ValoresSolicitud, hoy: string): Resumen['plan'] {
  if (!PATRON_DECIMAL.test(v.montoSolicitado) || !PATRON_DECIMAL.test(v.tasaAnual)) return null;
  if (!/^\d+$/.test(v.cantidadCuotas) || !esPeriodicidad(v.periodicidad)) return null;
  const condiciones = {
    monto: Number(v.montoSolicitado),
    tasaAnual: Number(v.tasaAnual),
    cuotas: Number(v.cantidadCuotas),
    periodicidad: v.periodicidad,
  };
  if (condiciones.cuotas > 360) return null;
  try {
    const plan = generarPlanAmortizacion({ ...condiciones, fechaBase: hoy });
    const suma = (campo: 'valorCuota' | 'interes') =>
      aUnidades(plan.reduce((total, cuota) => total + aCentavos(cuota[campo]), 0));
    return { cuota: calcularCuotaNivelada(condiciones), totalPagar: suma('valorCuota'), totalIntereses: suma('interes') };
  } catch {
    return null;
  }
}

export function resumirSolicitud(v: ValoresSolicitud, hoy: string): Resumen {
  const edad = esFechaValida(v.fechaNacimiento) && v.fechaNacimiento < hoy ? calcularEdad(v.fechaNacimiento, hoy) : null;
  return { edad, edadExcedida: edad !== null && edad > EDAD_MAXIMA, plan: calcularPlan(v, hoy) };
}
