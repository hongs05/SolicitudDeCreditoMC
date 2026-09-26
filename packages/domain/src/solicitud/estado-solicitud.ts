export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  DESEMBOLSADA = 'DESEMBOLSADA',
}

export type Accion = 'aprobar' | 'rechazar' | 'desembolsar';

export const TRANSICIONES: Record<Accion, { desde: EstadoSolicitud; hacia: EstadoSolicitud }> = {
  aprobar: { desde: EstadoSolicitud.PENDIENTE, hacia: EstadoSolicitud.APROBADA },
  rechazar: { desde: EstadoSolicitud.PENDIENTE, hacia: EstadoSolicitud.RECHAZADA },
  desembolsar: { desde: EstadoSolicitud.APROBADA, hacia: EstadoSolicitud.DESEMBOLSADA },
};

export function puedeEjecutar(estado: EstadoSolicitud, accion: Accion): boolean {
  return TRANSICIONES[accion].desde === estado;
}

export function esEstadoSolicitud(valor: string): valor is EstadoSolicitud {
  return (Object.values(EstadoSolicitud) as string[]).includes(valor);
}
