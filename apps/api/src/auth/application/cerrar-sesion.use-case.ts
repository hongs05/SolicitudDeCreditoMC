import type { Clock } from '../../shared/application/ports/clock';
import type { UnitOfWork } from '../../shared/application/ports/unit-of-work';
import type { SecretosRefresh } from './ports/secretos-refresh';

export class CerrarSesion {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly secretos: SecretosRefresh,
    private readonly clock: Clock,
  ) {}

  async ejecutar(valor: string | undefined): Promise<void> {
    if (!valor) return;
    await this.uow.run(async (repos) => {
      const token = await repos.refreshTokens.buscarPorHash(this.secretos.hashear(valor));
      if (token) await repos.refreshTokens.revocarFamilia(token.familiaId, this.clock.ahora());
    });
  }
}
