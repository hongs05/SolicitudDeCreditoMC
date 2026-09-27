import { BadRequestException, ForbiddenException, NotFoundException, PayloadTooLargeException, UnauthorizedException } from '@nestjs/common';
import { NoEncontradoError } from '@credito/domain';
import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { ValidacionException } from '../validation/validacion.exception';
import { clasificar } from './error-handler.filter';

describe('clasificar', () => {
  it('usa status, code y params de un DomainError', () => {
    expect(clasificar(new NoEncontradoError('Banco'))).toEqual({
      statusCode: 404, code: 'NO_ENCONTRADO', params: { recurso: 'Banco' },
    });
  });

  it('convierte ValidacionException en 400 con detalles', () => {
    const detalles = [{ field: 'x', code: 'REQUERIDO' as const, params: {} }];
    expect(clasificar(new ValidacionException(detalles))).toEqual({
      statusCode: 400, code: 'VALIDACION', params: {}, detalles,
    });
  });

  it.each([
    [new UnauthorizedException(), 401, 'NO_AUTENTICADO', {}],
    [new ForbiddenException(), 403, 'PROHIBIDO', {}],
    [new NotFoundException(), 404, 'NO_ENCONTRADO', { recurso: 'Recurso' }],
    [new BadRequestException(), 400, 'VALIDACION', {}],
    [new PayloadTooLargeException(), 413, 'VALIDACION', {}],
  ])('mapea %o', (excepcion, statusCode, code, params) => {
    expect(clasificar(excepcion)).toEqual({ statusCode, code, params });
  });

  it('una violación de unicidad de Prisma (P2002) es 409 CONFLICTO', () => {
    const excepcion = new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' });
    expect(clasificar(excepcion)).toEqual({ statusCode: 409, code: 'CONFLICTO', params: {} });
  });

  it('todo lo demás es 500 ERROR_INTERNO', () => {
    expect(clasificar(new Error('boom'))).toEqual({ statusCode: 500, code: 'ERROR_INTERNO', params: {} });
    expect(clasificar('texto')).toEqual({ statusCode: 500, code: 'ERROR_INTERNO', params: {} });
  });
});
