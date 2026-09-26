import { NoAutenticadoError } from '@credito/domain';
import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ES_PUBLICO } from '../../shared/infrastructure/http/publico.decorator';
import { TOKEN_ISSUER, type TokenIssuer } from '../application/ports/token-issuer';
import type { PeticionAutenticada } from './peticion';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKEN_ISSUER) private readonly tokens: TokenIssuer,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const publico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [ctx.getHandler(), ctx.getClass()]);
    if (publico) return true;

    const peticion = ctx.switchToHttp().getRequest<PeticionAutenticada>();
    const [tipo, token] = (peticion.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) throw new NoAutenticadoError();

    const payload = await this.tokens.verificar(token);
    peticion.usuario = { id: payload.sub, username: payload.username, rol: payload.rol };
    return true;
  }
}
