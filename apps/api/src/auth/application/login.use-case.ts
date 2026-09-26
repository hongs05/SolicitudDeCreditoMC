import { NoAutenticadoError } from '@credito/domain';
import type { Clock } from '../../shared/application/ports/clock';
import type { UnitOfWork } from '../../shared/application/ports/unit-of-work';
import { emitirSesion } from './emitir-sesion';
import type { OpcionesSesion } from './ports/opciones-sesion';
import type { PasswordHasher } from './ports/password-hasher';
import type { SecretosRefresh } from './ports/secretos-refresh';
import type { TokenIssuer } from './ports/token-issuer';
import type { SesionEmitida } from './sesion';

export class Login {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenIssuer,
    private readonly secretos: SecretosRefresh,
    private readonly opciones: OpcionesSesion,
    private readonly clock: Clock,
  ) {}

  ejecutar(username: string, password: string): Promise<SesionEmitida> {
    return this.uow.run(async (repos) => {
      const usuario = await repos.usuarios.buscarPorUsername(username);
      const valido = usuario ? await this.hasher.comparar(password, usuario.passwordHash) : false;
      if (!usuario || !valido) throw new NoAutenticadoError();
      const { sesion } = await emitirSesion(
        { tokens: this.tokens, secretos: this.secretos, opciones: this.opciones },
        repos,
        usuario,
        this.secretos.nuevaFamilia(),
        this.clock.ahora(),
      );
      return sesion;
    });
  }
}
