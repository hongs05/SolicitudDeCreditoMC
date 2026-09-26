import type { RefreshTokenRepository } from '../../../auth/application/ports/refresh-token.repository';
import type { UsuarioRepository } from '../../../auth/application/ports/usuario.repository';
import type { CreditoRepository } from '../../../creditos/application/ports/credito.repository';
import type { DesembolsoRepository } from '../../../desembolsos/application/ports/desembolso.repository';
import type { SolicitudRepository } from '../../../solicitudes/application/ports/solicitud.repository';
import type { CatalogoRepository } from './catalogo.repository';

export interface RepositoriosTx {
  usuarios: UsuarioRepository;
  refreshTokens: RefreshTokenRepository;
  solicitudes: SolicitudRepository;
  creditos: CreditoRepository;
  desembolsos: DesembolsoRepository;
  catalogos: CatalogoRepository;
}

export interface UnitOfWork {
  run<T>(fn: (repos: RepositoriosTx) => Promise<T>): Promise<T>;
}

export const UNIT_OF_WORK = Symbol('UnitOfWork');
