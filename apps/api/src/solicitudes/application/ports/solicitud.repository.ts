import type { Solicitud, SolicitudPrevia } from '@credito/domain';

export interface SolicitudRepository {
  obtenerPorId(id: number): Promise<Solicitud | null>;
  /** Solicitudes anteriores de una cédula, para las reglas de solicitud abierta y fecha de nacimiento. */
  historialPorCedula(cedula: string): Promise<SolicitudPrevia[]>;
  crear(solicitud: Solicitud): Promise<Solicitud>;
  guardar(solicitud: Solicitud): Promise<void>;
}
