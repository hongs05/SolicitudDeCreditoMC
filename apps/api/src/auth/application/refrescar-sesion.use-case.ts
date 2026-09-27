import { type DomainError, NoAutenticadoError, TokenRevocadoError } from '@credito/domain';
import type { Clock } from '../../shared/application/ports/clock';
import type { UnitOfWork } from '../../shared/application/ports/unit-of-work';
import { emitirSesion } from './emitir-sesion';
import type { OpcionesSesion } from './ports/opciones-sesion';
import type { SecretosRefresh } from './ports/secretos-refresh';
import type { TokenIssuer } from './ports/token-issuer';
import type { SesionEmitida } from './sesion';

type Resultado = { ok: true; sesion: SesionEmitida } | { ok: false; error: DomainError };

export class RefrescarSesion {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tokens: TokenIssuer,
    private readonly secretos: SecretosRefresh,
    private readonly opciones: OpcionesSesion,
    private readonly clock: Clock,
  ) {}

  async ejecutar(valor: string | undefined): Promise<SesionEmitida> {
    if (!valor) throw new NoAutenticadoError();

    const resultado = await this.uow.run(async (repos): Promise<Resultado> => {
      const ahora = this.clock.ahora();
      const actual = await repos.refreshTokens.buscarPorHash(this.secretos.hashear(valor));
      if (!actual) return { ok: false, error: new NoAutenticadoError() };

      if (actual.estaRevocado()) {
        await repos.refreshTokens.revocarFamilia(actual.familiaId, ahora);
        return { ok: false, error: new TokenRevocadoError() };
      }
      if (!actual.estaVigente(ahora)) {
        actual.revocar(ahora);
        await repos.refreshTokens.guardar(actual);
        return { ok: false, error: new NoAutenticadoError() };
      }

      const usuario = await repos.usuarios.obtenerPorId(actual.usuarioId);
      if (!usuario) return { ok: false, error: new NoAutenticadoError() };

      const { sesion, token } = await emitirSesion(
        { tokens: this.tokens, secretos: this.secretos, opciones: this.opciones },
        repos,
        usuario,
        actual.familiaId,
        ahora,
      );
      actual.rotar(token.id!, ahora);
      await repos.refreshTokens.guardar(actual);
      return { ok: true, sesion };
    });

    if (!resultado.ok) throw resultado.error;
    return resultado.sesion;
  }
}
