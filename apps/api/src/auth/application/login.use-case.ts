import { NoAutenticadoError } from '@credito/domain';
import type { Clock } from '../../shared/application/ports/clock';
import type { UnitOfWork } from '../../shared/application/ports/unit-of-work';
import { emitirSesion } from './emitir-sesion';
import type { OpcionesSesion } from './ports/opciones-sesion';
import type { PasswordHasher } from './ports/password-hasher';
import type { SecretosRefresh } from './ports/secretos-refresh';
import type { TokenIssuer } from './ports/token-issuer';
import type { SesionEmitida } from './sesion';

// Hash bcrypt (costo 10) de un valor arbitrario que nunca se usa como contraseña real.
// Se compara contra él cuando el usuario no existe, para que `comparar` tarde lo mismo
// que con un usuario real y así no revelar por temporización si el username existe.
const HASH_FICTICIO = '$2b$10$UVRqdmihUij1qnKPR6Sdj.M2GpACTTH1UhngDUQT5PLHaJ56tMtwO';

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
      const valido = await this.hasher.comparar(password, usuario?.passwordHash ?? HASH_FICTICIO);
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
