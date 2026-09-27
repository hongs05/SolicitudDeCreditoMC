import type { Rol } from '@credito/domain';

export interface UsuarioSesion {
  id: number;
  username: string;
  rol: Rol;
}

export interface TokensResponse {
  accessToken: string;
  usuario: UsuarioSesion;
}

export interface EstadoSesion {
  accessToken: string | null;
  usuario: UsuarioSesion | null;
}

const VACIA: EstadoSesion = { accessToken: null, usuario: null };
let estado: EstadoSesion = VACIA;
const oyentes = new Set<() => void>();

export const sesion = {
  obtener: (): EstadoSesion => estado,
  establecer(nuevo: EstadoSesion): void {
    estado = nuevo;
    oyentes.forEach((oyente) => oyente());
  },
  limpiar(): void {
    sesion.establecer(VACIA);
  },
  suscribir(oyente: () => void): () => void {
    oyentes.add(oyente);
    return () => {
      oyentes.delete(oyente);
    };
  },
};
