import type { CodigoValidacion } from '@credito/domain';
import { BadRequestException } from '@nestjs/common';

export interface DetalleValidacion {
  field: string;
  code: CodigoValidacion;
  params: Record<string, unknown>;
}

export class ValidacionException extends BadRequestException {
  constructor(readonly detalles: DetalleValidacion[]) {
    super('VALIDACION');
  }
}
