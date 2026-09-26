export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  DESEMBOLSADA = 'DESEMBOLSADA',
}

export type Accion = 'aprobar' | 'rechazar' | 'desembolsar';
