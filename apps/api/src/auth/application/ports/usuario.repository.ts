import type { Usuario } from '../../domain/usuario';

export interface UsuarioRepository {
  buscarPorUsername(username: string): Promise<Usuario | null>;
  obtenerPorId(id: number): Promise<Usuario | null>;
}
