import { NoAutenticadoError, type Rol } from '@credito/domain';
import type { PasswordHasher } from '../auth/application/ports/password-hasher';
import type { SecretosRefresh } from '../auth/application/ports/secretos-refresh';
import type { PayloadAcceso, TokenIssuer } from '../auth/application/ports/token-issuer';

export class HasherFalso implements PasswordHasher {
  async hash(texto: string): Promise<string> {
    return `hash:${texto}`;
  }

  async comparar(texto: string, valorHash: string): Promise<boolean> {
    return valorHash === `hash:${texto}`;
  }
}

export class TokenIssuerFalso implements TokenIssuer {
  async firmar(p: PayloadAcceso): Promise<string> {
    return `acceso:${p.sub}:${p.username}:${p.rol}`;
  }

  async verificar(token: string): Promise<PayloadAcceso> {
    const [prefijo, sub, username, rol] = token.split(':');
    if (prefijo !== 'acceso' || !sub || !username || !rol) throw new NoAutenticadoError();
    return { sub: Number(sub), username, rol: rol as Rol };
  }
}

export class SecretosFalsos implements SecretosRefresh {
  private tokens = 0;
  private familias = 0;

  generar(): string {
    return `refresh-${++this.tokens}`;
  }

  hashear(valor: string): string {
    return `sha:${valor}`;
  }

  nuevaFamilia(): string {
    return `familia-${++this.familias}`;
  }
}
