import type { Rol } from '@credito/domain';

export interface PayloadAcceso {
  sub: number;
  username: string;
  rol: Rol;
}

export interface TokenIssuer {
  firmar(payload: PayloadAcceso): Promise<string>;
  verificar(token: string): Promise<PayloadAcceso>;
}

export const TOKEN_ISSUER = Symbol('TokenIssuer');
