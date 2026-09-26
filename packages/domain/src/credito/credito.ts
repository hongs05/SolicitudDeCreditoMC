import { CreditoNoAprobadoError } from '../errors/errores';
import { EstadoSolicitud } from '../solicitud/estado-solicitud';
import type { Solicitud } from '../solicitud/solicitud';
import { calcularCuotaNivelada } from './cuota-nivelada';
import type { Periodicidad } from './periodicidad';
import { type CuotaPlan, generarPlanAmortizacion } from './plan-amortizacion';

export interface CreditoProps {
  id: number | null;
  secuencia: number;
  numero: string;
  solicitudId: number;
  monto: number;
  tasaAnual: number;
  periodicidad: Periodicidad;
  plazo: number;
  cuotaNivelada: number;
  fechaBase: string;
}

export function formatearNumeroCredito(secuencia: number): string {
  return `CR-${String(secuencia).padStart(6, '0')}`;
}

export class Credito {
  private constructor(private readonly props: CreditoProps) {}

  static desde(solicitud: Solicitud, secuencia: number, fechaBase: string): Credito {
    const s = solicitud.snapshot();
    if (s.id === null) {
      throw new Error('La solicitud debe estar persistida antes de crear el crédito');
    }
    if (s.estado !== EstadoSolicitud.APROBADA) {
      throw new CreditoNoAprobadoError(s.estado);
    }
    const condiciones = solicitud.condiciones();
    return new Credito({
      id: null,
      secuencia,
      numero: formatearNumeroCredito(secuencia),
      solicitudId: s.id,
      monto: condiciones.monto,
      tasaAnual: condiciones.tasaAnual,
      periodicidad: condiciones.periodicidad,
      plazo: condiciones.cuotas,
      cuotaNivelada: calcularCuotaNivelada(condiciones),
      fechaBase,
    });
  }

  static reconstituir(props: CreditoProps): Credito {
    return new Credito({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get solicitudId(): number {
    return this.props.solicitudId;
  }

  snapshot(): CreditoProps {
    return { ...this.props };
  }

  generarPlan(): CuotaPlan[] {
    return generarPlanAmortizacion({
      monto: this.props.monto,
      tasaAnual: this.props.tasaAnual,
      cuotas: this.props.plazo,
      periodicidad: this.props.periodicidad,
      fechaBase: this.props.fechaBase,
    });
  }
}
