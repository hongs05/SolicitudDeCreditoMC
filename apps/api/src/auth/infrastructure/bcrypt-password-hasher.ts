import { compare, hash } from 'bcryptjs';
import type { PasswordHasher } from '../application/ports/password-hasher';

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly costo = 10) {}

  hash(texto: string): Promise<string> {
    return hash(texto, this.costo);
  }

  comparar(texto: string, valorHash: string): Promise<boolean> {
    return compare(texto, valorHash);
  }
}
