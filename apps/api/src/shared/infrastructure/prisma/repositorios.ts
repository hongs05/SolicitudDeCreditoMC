import { PrismaRefreshTokenRepository } from '../../../auth/infrastructure/prisma-refresh-token.repository';
import { PrismaUsuarioRepository } from '../../../auth/infrastructure/prisma-usuario.repository';
import { PrismaCreditoRepository } from '../../../creditos/infrastructure/prisma-credito.repository';
import { PrismaDesembolsoRepository } from '../../../desembolsos/infrastructure/prisma-desembolso.repository';
import { PrismaSolicitudRepository } from '../../../solicitudes/infrastructure/prisma-solicitud.repository';
import type { RepositoriosTx } from '../../application/ports/unit-of-work';
import type { ClientePrisma } from './decimal';
import { PrismaCatalogoRepository } from './prisma-catalogo.repository';

export function crearRepositorios(db: ClientePrisma): RepositoriosTx {
  return {
    usuarios: new PrismaUsuarioRepository(db),
    refreshTokens: new PrismaRefreshTokenRepository(db),
    solicitudes: new PrismaSolicitudRepository(db),
    creditos: new PrismaCreditoRepository(db),
    desembolsos: new PrismaDesembolsoRepository(db),
    catalogos: new PrismaCatalogoRepository(db),
  };
}
