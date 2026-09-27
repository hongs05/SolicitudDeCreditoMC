export interface SecretosRefresh {
  generar(): string;
  hashear(valor: string): string;
  nuevaFamilia(): string;
}

export const SECRETOS_REFRESH = Symbol('SecretosRefresh');
