import type { RefreshToken } from '../../domain/refresh-token';

export interface RefreshTokenRepository {
  crear(token: RefreshToken): Promise<RefreshToken>;
  buscarPorHash(hash: string): Promise<RefreshToken | null>;
  guardar(token: RefreshToken): Promise<void>;
  revocarFamilia(familiaId: string, ahora: Date): Promise<void>;
}
