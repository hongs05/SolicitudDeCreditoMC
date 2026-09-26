import { Credito, NoEncontradoError } from '@credito/domain';
import type { Clock } from '../../shared/application/ports/clock';
import type { UnitOfWork } from '../../shared/application/ports/unit-of-work';

export interface ComandoDictamen {
  solicitudId: number;
  observaciones: string;
  usuarioId: number;
}

export class AprobarSolicitud {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  ejecutar(c: ComandoDictamen): Promise<{ creditoId: number }> {
    return this.uow.run(async (repos) => {
      const solicitud = await repos.solicitudes.obtenerPorId(c.solicitudId);
      if (!solicitud) throw new NoEncontradoError('Solicitud');

      solicitud.aprobar(c.observaciones, c.usuarioId, this.clock.ahora());
      const secuencia = await repos.creditos.siguienteSecuencia();
      const credito = Credito.desde(solicitud, secuencia, this.clock.hoy());

      await repos.solicitudes.guardar(solicitud);
      const creado = await repos.creditos.crear(credito, credito.generarPlan());
      return { creditoId: creado.id! };
    });
  }
}
