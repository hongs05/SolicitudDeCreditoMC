export interface DetalleError {
  field: string;
  code: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: DetalleError[] = [],
    readonly params: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
