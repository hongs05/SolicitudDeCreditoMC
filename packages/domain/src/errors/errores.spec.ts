import { describe, expect, it } from 'vitest';
import { EstadoSolicitud } from '../solicitud/estado-solicitud';
import { esDomainError } from './domain-error';
import {
  CreditoNoAprobadoError, CreditoYaDesembolsadoError, EdadMaximaExcedidaError,
  NoAutenticadoError, NoEncontradoError, ObservacionesRequeridasError,
  ParametrosCreditoInvalidosError, TokenRevocadoError, TransicionInvalidaError,
} from './errores';

describe('errores de dominio', () => {
  it.each([
    [new TransicionInvalidaError('aprobar', EstadoSolicitud.APROBADA), 'TRANSICION_INVALIDA', 409, { accion: 'aprobar', estado: 'APROBADA' }],
    [new CreditoYaDesembolsadoError(), 'CREDITO_YA_DESEMBOLSADO', 409, {}],
    [new EdadMaximaExcedidaError(81), 'EDAD_MAXIMA_EXCEDIDA', 422, { edad: 81 }],
    [new ObservacionesRequeridasError(), 'OBSERVACIONES_REQUERIDAS', 422, {}],
    [new CreditoNoAprobadoError(EstadoSolicitud.PENDIENTE), 'CREDITO_NO_APROBADO', 422, { estado: 'PENDIENTE' }],
    [new ParametrosCreditoInvalidosError('monto'), 'PARAMETROS_CREDITO_INVALIDOS', 422, { campo: 'monto' }],
    [new NoEncontradoError('Banco'), 'NO_ENCONTRADO', 404, { recurso: 'Banco' }],
    [new TokenRevocadoError(), 'TOKEN_REVOCADO', 401, {}],
    [new NoAutenticadoError(), 'NO_AUTENTICADO', 401, {}],
  ])('%o expone code, httpStatus y params', (error, code, status, params) => {
    expect(error.code).toBe(code);
    expect(error.httpStatus).toBe(status);
    expect(error.params).toEqual(params);
    expect(error).toBeInstanceOf(Error);
    expect(esDomainError(error)).toBe(true);
  });

  it('esDomainError rechaza errores comunes', () => {
    expect(esDomainError(new Error('x'))).toBe(false);
    expect(esDomainError({ code: 'X' })).toBe(false);
    expect(esDomainError(null)).toBe(false);
  });
});
