export interface PasswordHasher {
  hash(texto: string): Promise<string>;
  comparar(texto: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PasswordHasher');
