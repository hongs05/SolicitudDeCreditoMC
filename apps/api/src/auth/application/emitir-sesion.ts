import type { RepositoriosTx } from '../../shared/application/ports/unit-of-work';
import { RefreshToken } from '../domain/refresh-token';
import type { Usuario } from '../domain/usuario';
import type { OpcionesSesion } from './ports/opciones-sesion';
import type { SecretosRefresh } from './ports/secretos-refresh';
import type { TokenIssuer } from './ports/token-issuer';
import type { SesionEmitida } from './sesion';

export interface DependenciasSesion {
  tokens: TokenIssuer;
  secretos: SecretosRefresh;
  opciones: OpcionesSesion;
}

export async function emitirSesion(
  deps: DependenciasSesion,
  repos: RepositoriosTx,
  usuario: Usuario,
  familiaId: string,
  ahora: Date,
): Promise<{ sesion: SesionEmitida; token: RefreshToken }> {
  const valor = deps.secretos.generar();
  const token = await repos.refreshTokens.crear(
    RefreshToken.emitir({
      usuarioId: usuario.id,
      familiaId,
      tokenHash: deps.secretos.hashear(valor),
      ahora,
      ttlDias: deps.opciones.refreshTtlDias,
    }),
  );
  const accessToken = await deps.tokens.firmar({ sub: usuario.id, username: usuario.username, rol: usuario.rol });
  return {
    token,
    sesion: {
      accessToken,
      refreshToken: valor,
      refreshExpiraEn: token.snapshot().expiraEn,
      usuario: { id: usuario.id, username: usuario.username, rol: usuario.rol },
    },
  };
}
