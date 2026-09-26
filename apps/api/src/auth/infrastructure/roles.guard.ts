import { type Rol, tieneRol } from '@credito/domain';
import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PeticionAutenticada } from './peticion';
import { ROLES } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Rol[] | undefined>(ROLES, [ctx.getHandler(), ctx.getClass()]);
    if (!roles) return true;
    const usuario = ctx.switchToHttp().getRequest<PeticionAutenticada>().usuario;
    if (!usuario || !tieneRol(usuario.rol, roles)) throw new ForbiddenException();
    return true;
  }
}
