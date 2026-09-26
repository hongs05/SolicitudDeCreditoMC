import { esRol } from '@credito/domain';
import type { Usuario as UsuarioFila } from '@prisma/client';
import type { ClientePrisma } from '../../shared/infrastructure/prisma/decimal';
import type { UsuarioRepository } from '../application/ports/usuario.repository';
import type { Usuario } from '../domain/usuario';

function aUsuario(fila: UsuarioFila): Usuario {
  if (!esRol(fila.rol)) throw new Error(`Usuario ${fila.id} con rol inválido`);
  return { id: fila.id, username: fila.username, passwordHash: fila.passwordHash, rol: fila.rol };
}

export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly db: ClientePrisma) {}

  async buscarPorUsername(username: string): Promise<Usuario | null> {
    const fila = await this.db.usuario.findUnique({ where: { username } });
    return fila ? aUsuario(fila) : null;
  }

  async obtenerPorId(id: number): Promise<Usuario | null> {
    const fila = await this.db.usuario.findUnique({ where: { id } });
    return fila ? aUsuario(fila) : null;
  }
}
