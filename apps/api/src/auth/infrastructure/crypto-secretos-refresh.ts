import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { SecretosRefresh } from '../application/ports/secretos-refresh';

export class CryptoSecretosRefresh implements SecretosRefresh {
  generar(): string {
    return randomBytes(32).toString('base64url');
  }

  hashear(valor: string): string {
    return createHash('sha256').update(valor).digest('hex');
  }

  nuevaFamilia(): string {
    return randomUUID();
  }
}
