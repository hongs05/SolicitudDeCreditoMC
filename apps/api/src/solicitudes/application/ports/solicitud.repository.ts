import type { Solicitud } from '@credito/domain';

export interface SolicitudRepository {
  obtenerPorId(id: number): Promise<Solicitud | null>;
  crear(solicitud: Solicitud): Promise<Solicitud>;
  guardar(solicitud: Solicitud): Promise<void>;
}
