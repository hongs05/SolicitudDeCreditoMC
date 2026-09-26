import { type CondicionesCredito, cuotaNiveladaEnCentavos, tasaPeriodica } from './cuota-nivelada';
import { aCentavos, aUnidades } from './dinero';
import { fechaVencimiento } from './vencimientos';

export interface CuotaPlan {
  numero: number;
  fechaVencimiento: string;
  capital: number;
  interes: number;
  valorCuota: number;
  saldoRestante: number;
}

export interface ParametrosPlan extends CondicionesCredito {
  fechaBase: string;
}

// Banker's rounding: round 0.5 to nearest even
function redondearMitadAlPar(n: number): number {
  const piso = Math.floor(n);
  const frac = n - piso;
  if (frac < 0.5) return piso;
  if (frac > 0.5) return Math.ceil(n);
  // frac === 0.5, round to even
  return piso % 2 === 0 ? piso : piso + 1;
}

export function generarPlanAmortizacion(p: ParametrosPlan): CuotaPlan[] {
  const cuotaCentavos = cuotaNiveladaEnCentavos(p);
  const i = tasaPeriodica(p.tasaAnual, p.periodicidad);
  let saldoCentavos = aCentavos(p.monto);
  const plan: CuotaPlan[] = [];

  for (let numero = 1; numero <= p.cuotas; numero++) {
    const interesCentavos = redondearMitadAlPar(saldoCentavos * i);
    const esUltima = numero === p.cuotas;
    const capitalCentavos = esUltima
      ? saldoCentavos
      : Math.min(cuotaCentavos - interesCentavos, saldoCentavos);
    const valorCentavos = esUltima || capitalCentavos < cuotaCentavos - interesCentavos
      ? capitalCentavos + interesCentavos
      : cuotaCentavos;
    saldoCentavos -= capitalCentavos;

    plan.push({
      numero,
      fechaVencimiento: fechaVencimiento(p.fechaBase, p.periodicidad, numero),
      capital: aUnidades(capitalCentavos),
      interes: aUnidades(interesCentavos),
      valorCuota: aUnidades(valorCentavos),
      saldoRestante: aUnidades(saldoCentavos),
    });
  }

  return plan;
}
