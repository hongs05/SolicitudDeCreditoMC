import {
  aCentavos, aUnidades, calcularCuotaNivelada, calcularEdad, EDAD_MAXIMA,
  esFechaValida, esPeriodicidad, generarPlanAmortizacion, PERIODOS_POR_ANIO, type Periodicidad,
} from '@credito/domain';
import { PATRON_DECIMAL, type ValoresSolicitud } from './esquema';

/** Por encima de este porcentaje el panel advierte que la cuota pesa mucho sobre el ingreso. No bloquea. */
export const RELACION_ALTA = 40;

export interface Resumen {
  edad: number | null;
  edadExcedida: boolean;
  plan: { cuota: number; totalPagar: number; totalIntereses: number } | null;
  /** Porcentaje del ingreso mensual que representa la cuota llevada a base mensual. */
  relacion: number | null;
}

/** Cuota expresada por mes (una quincenal cuenta doble, una anual la doceava parte) sobre el ingreso mensual, en %. */
export function relacionCuotaIngreso(cuota: number, periodicidad: Periodicidad, ingresoMensual: number): number | null {
  if (!(ingresoMensual > 0)) return null;
  const mensual = (cuota * PERIODOS_POR_ANIO[periodicidad]) / 12;
  return Math.round((mensual / ingresoMensual) * 100);
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
  const plan = calcularPlan(v, hoy);
  const relacion = plan && esPeriodicidad(v.periodicidad) && PATRON_DECIMAL.test(v.ingresoMensual)
    ? relacionCuotaIngreso(plan.cuota, v.periodicidad, Number(v.ingresoMensual))
    : null;
  return { edad, edadExcedida: edad !== null && edad > EDAD_MAXIMA, plan, relacion };
}
