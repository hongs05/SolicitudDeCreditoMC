import type { Request } from 'express';
import type { UsuarioSesion } from '../application/sesion';

export interface PeticionAutenticada extends Request {
  usuario?: UsuarioSesion;
}
