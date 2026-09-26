import type { Rol } from '@credito/domain';

export interface ItemCatalogo {
  id: number;
  codigo: string;
  nombre: string;
}

export interface UsuarioVista {
  id: number;
  username: string;
  rol: Rol;
}

export interface Paginacion {
  page: number;
  pageSize: number;
}

export interface Paginado<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
