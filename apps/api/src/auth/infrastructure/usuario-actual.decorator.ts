import { NoAutenticadoError } from '@credito/domain';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UsuarioSesion } from '../application/sesion';
import type { PeticionAutenticada } from './peticion';

export const UsuarioActual = createParamDecorator((_dato: unknown, ctx: ExecutionContext): UsuarioSesion => {
  const usuario = ctx.switchToHttp().getRequest<PeticionAutenticada>().usuario;
  if (!usuario) throw new NoAutenticadoError();
  return usuario;
});
