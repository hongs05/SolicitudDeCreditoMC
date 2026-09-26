import type { RefreshToken as RefreshTokenFila } from '@prisma/client';
import type { ClientePrisma } from '../../shared/infrastructure/prisma/decimal';
import type { RefreshTokenRepository } from '../application/ports/refresh-token.repository';
import { RefreshToken } from '../domain/refresh-token';

const aToken = (f: RefreshTokenFila): RefreshToken =>
  RefreshToken.reconstituir({
    id: f.id,
    usuarioId: f.usuarioId,
    familiaId: f.familiaId,
    tokenHash: f.tokenHash,
    expiraEn: f.expiraEn,
    creadoEn: f.creadoEn,
    revocadoEn: f.revocadoEn,
    reemplazadoPorId: f.reemplazadoPorId,
  });

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly db: ClientePrisma) {}

  async crear(token: RefreshToken): Promise<RefreshToken> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se descarta el id, aún no asignado por la base de datos
    const { id: _id, ...datos } = token.snapshot();
    return aToken(await this.db.refreshToken.create({ data: datos }));
  }

  async buscarPorHash(hash: string): Promise<RefreshToken | null> {
    const fila = await this.db.refreshToken.findUnique({ where: { tokenHash: hash } });
    return fila ? aToken(fila) : null;
  }

  async guardar(token: RefreshToken): Promise<void> {
    const p = token.snapshot();
    if (p.id === null) throw new Error('No se puede guardar un token sin id');
    await this.db.refreshToken.update({
      where: { id: p.id },
      data: { revocadoEn: p.revocadoEn, reemplazadoPorId: p.reemplazadoPorId },
    });
  }

  async revocarFamilia(familiaId: string, ahora: Date): Promise<void> {
    await this.db.refreshToken.updateMany({ where: { familiaId, revocadoEn: null }, data: { revocadoEn: ahora } });
  }
}
