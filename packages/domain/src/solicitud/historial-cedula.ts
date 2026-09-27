import { CedulaFechaDistintaError, SolicitudAbiertaExistenteError } from '../errors/errores';
import { EstadoSolicitud } from './estado-solicitud';

export interface SolicitudPrevia {
  id: number;
  estado: EstadoSolicitud;
  fechaNacimiento: string;
}

/** Estados en los que una solicitud sigue abierta: aún puede dictaminarse o desembolsarse. */
export const ESTADOS_ABIERTOS: readonly EstadoSolicitud[] = [EstadoSolicitud.PENDIENTE, EstadoSolicitud.APROBADA];

/**
 * Reglas sobre las solicitudes anteriores de la misma cédula: no puede haber dos abiertas a la vez,
 * y la fecha de nacimiento debe coincidir con la ya registrada.
 */
export function verificarHistorialCedula(fechaNacimiento: string, previas: readonly SolicitudPrevia[]): void {
  const abierta = previas.find((p) => ESTADOS_ABIERTOS.includes(p.estado));
  if (abierta) throw new SolicitudAbiertaExistenteError(abierta.id, abierta.estado);
  if (previas.some((p) => p.fechaNacimiento !== fechaNacimiento)) throw new CedulaFechaDistintaError();
}
