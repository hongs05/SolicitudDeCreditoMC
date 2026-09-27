import type { Rol } from '@credito/domain';

export interface Usuario {
  id: number;
  username: string;
  passwordHash: string;
  rol: Rol;
}
