import { type CondicionesCredito, calcularCuotaNivelada, validarCondiciones } from '../credito/cuota-nivelada';
import type { Periodicidad } from '../credito/periodicidad';
import {
  CreditoNoAprobadoError, CreditoYaDesembolsadoError,
  ObservacionesRequeridasError, TransicionInvalidaError,
} from '../errors/errores';
import { calcularEdad, validarAntiguedad, validarEdad } from './edad';
import { EstadoSolicitud, puedeEjecutar, TRANSICIONES } from './estado-solicitud';

export interface DatosSolicitud {
  nombreCompleto: string;
  cedula: string;
  correo: string;
  telefono: string;
  fechaNacimiento: string;
  tipoEmpleoId: number;
  empresa: string;
  antiguedadAnios: number;
  ingresoMensual: number;
  montoSolicitado: number;
  cantidadCuotas: number;
  tasaAnual: number;
  periodicidad: Periodicidad;
}

export interface SolicitudProps extends DatosSolicitud {
  id: number | null;
  estado: EstadoSolicitud;
  observaciones: string | null;
  dictaminadaPorId: number | null;
  dictaminadaEn: Date | null;
  creadaPorId: number;
  creadaEn: Date;
}

export class Solicitud {
  private constructor(private props: SolicitudProps) {}

  static crear(datos: DatosSolicitud, creadaPorId: number, hoy: string, ahora: Date): Solicitud {
    const edad = validarEdad(datos.fechaNacimiento, hoy);
    validarAntiguedad(datos.antiguedadAnios, edad);
    const solicitud = new Solicitud({
      ...datos,
      id: null,
      estado: EstadoSolicitud.PENDIENTE,
      observaciones: null,
      dictaminadaPorId: null,
      dictaminadaEn: null,
      creadaPorId,
      creadaEn: ahora,
    });
    validarCondiciones(solicitud.condiciones());
    return solicitud;
  }

  static reconstituir(props: SolicitudProps): Solicitud {
    return new Solicitud({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get estado(): EstadoSolicitud {
    return this.props.estado;
  }

  snapshot(): SolicitudProps {
    return { ...this.props };
  }

  condiciones(): CondicionesCredito {
    return {
      monto: this.props.montoSolicitado,
      tasaAnual: this.props.tasaAnual,
      cuotas: this.props.cantidadCuotas,
      periodicidad: this.props.periodicidad,
    };
  }

  edad(hoy: string): number {
    return calcularEdad(this.props.fechaNacimiento, hoy);
  }

  cuotaNivelada(): number {
    return calcularCuotaNivelada(this.condiciones());
  }

  aprobar(observaciones: string, usuarioId: number, ahora: Date): void {
    this.dictaminar('aprobar', observaciones, usuarioId, ahora);
  }

  rechazar(observaciones: string, usuarioId: number, ahora: Date): void {
    this.dictaminar('rechazar', observaciones, usuarioId, ahora);
  }

  desembolsar(): void {
    if (this.props.estado === EstadoSolicitud.DESEMBOLSADA) {
      throw new CreditoYaDesembolsadoError();
    }
    if (!puedeEjecutar(this.props.estado, 'desembolsar')) {
      throw new CreditoNoAprobadoError(this.props.estado);
    }
    this.props = { ...this.props, estado: TRANSICIONES.desembolsar.hacia };
  }

  private dictaminar(
    accion: 'aprobar' | 'rechazar',
    observaciones: string,
    usuarioId: number,
    ahora: Date,
  ): void {
    if (!puedeEjecutar(this.props.estado, accion)) {
      throw new TransicionInvalidaError(accion, this.props.estado);
    }
    const limpias = observaciones.trim();
    if (!limpias) throw new ObservacionesRequeridasError();
    this.props = {
      ...this.props,
      estado: TRANSICIONES[accion].hacia,
      observaciones: limpias,
      dictaminadaPorId: usuarioId,
      dictaminadaEn: ahora,
    };
  }
}
