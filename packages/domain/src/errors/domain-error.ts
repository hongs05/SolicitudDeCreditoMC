import type { CodigoError } from '../i18n/codigos';

export abstract class DomainError extends Error {
  protected constructor(
    readonly code: CodigoError,
    readonly httpStatus: number,
    readonly params: Record<string, unknown> = {},
  ) {
    super(code);
    this.name = new.target.name;
  }
}

export function esDomainError(valor: unknown): valor is DomainError {
  if (valor instanceof DomainError) return true;
  return (
    valor instanceof Error &&
    typeof (valor as Partial<DomainError>).code === 'string' &&
    typeof (valor as Partial<DomainError>).httpStatus === 'number' &&
    typeof (valor as Partial<DomainError>).params === 'object' &&
    (valor as Partial<DomainError>).params !== null
  );
}
