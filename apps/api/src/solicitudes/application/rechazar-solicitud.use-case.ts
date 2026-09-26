import { NoEncontradoError } from '@credito/domain';
import type { Clock } from '../../shared/application/ports/clock';
import type { UnitOfWork } from '../../shared/application/ports/unit-of-work';
import type { ComandoDictamen } from './aprobar-solicitud.use-case';

export class RechazarSolicitud {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  ejecutar(c: ComandoDictamen): Promise<void> {
    return this.uow.run(async (repos) => {
      const solicitud = await repos.solicitudes.obtenerPorId(c.solicitudId);
      if (!solicitud) throw new NoEncontradoError('Solicitud');
      solicitud.rechazar(c.observaciones, c.usuarioId, this.clock.ahora());
      await repos.solicitudes.guardar(solicitud);
    });
  }
}
