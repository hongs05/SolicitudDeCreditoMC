import { esRol, NoAutenticadoError } from '@credito/domain';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PayloadAcceso, TokenIssuer } from '../application/ports/token-issuer';

@Injectable()
export class JwtTokenIssuer implements TokenIssuer {
  constructor(private readonly jwt: JwtService) {}

  firmar(p: PayloadAcceso): Promise<string> {
    return this.jwt.signAsync({ sub: p.sub, username: p.username, rol: p.rol });
  }

  async verificar(token: string): Promise<PayloadAcceso> {
    try {
      const datos = await this.jwt.verifyAsync<Record<string, unknown>>(token);
      const { sub, username, rol } = datos;
      if (typeof sub !== 'number' || typeof username !== 'string' || typeof rol !== 'string' || !esRol(rol)) {
        throw new Error('Payload inválido');
      }
      return { sub, username, rol };
    } catch {
      throw new NoAutenticadoError();
    }
  }
}
