import type { Rol } from '@credito/domain';

export interface UsuarioSesion {
  id: number;
  username: string;
  rol: Rol;
}

export interface SesionEmitida {
  accessToken: string;
  refreshToken: string;
  refreshExpiraEn: Date;
  usuario: UsuarioSesion;
}
