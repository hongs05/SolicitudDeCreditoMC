import { NoEncontradoError } from '@credito/domain';
import type { Clock } from '../../shared/application/ports/clock';
import type { UnitOfWork } from '../../shared/application/ports/unit-of-work';

export interface ComandoDesembolso {
  creditoId: number;
  bancoId: number;
  numeroCuenta: string;
  usuarioId: number;
}

export class Desembolsar {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  ejecutar(c: ComandoDesembolso): Promise<void> {
    return this.uow.run(async (repos) => {
      const credito = await repos.creditos.obtenerPorId(c.creditoId);
      if (!credito) throw new NoEncontradoError('Credito');
      if (!(await repos.catalogos.bancoActivo(c.bancoId))) throw new NoEncontradoError('Banco');

      const solicitud = await repos.solicitudes.obtenerPorId(credito.solicitudId);
      if (!solicitud) throw new NoEncontradoError('Solicitud');

      solicitud.desembolsar();
      await repos.solicitudes.guardar(solicitud);
      await repos.desembolsos.crear({
        creditoId: c.creditoId,
        bancoId: c.bancoId,
        numeroCuenta: c.numeroCuenta,
        ejecutadoPorId: c.usuarioId,
        ejecutadoEn: this.clock.ahora(),
      });
    });
  }
}
