import type { Accion, EstadoSolicitud } from '../solicitud/estado-solicitud';
import { DomainError } from './domain-error';

export type Recurso = 'Solicitud' | 'Credito' | 'Banco' | 'TipoEmpleo' | 'Usuario' | 'Recurso';
export type CampoCredito = 'monto' | 'cuotas' | 'tasaAnual' | 'periodicidad';

export class TransicionInvalidaError extends DomainError {
  constructor(accion: Accion, estado: EstadoSolicitud) {
    super('TRANSICION_INVALIDA', 409, { accion, estado });
  }
}

export class CreditoYaDesembolsadoError extends DomainError {
  constructor() {
    super('CREDITO_YA_DESEMBOLSADO', 409);
  }
}

export class EdadMaximaExcedidaError extends DomainError {
  constructor(edad: number) {
    super('EDAD_MAXIMA_EXCEDIDA', 422, { edad });
  }
}

export class ObservacionesRequeridasError extends DomainError {
  constructor() {
    super('OBSERVACIONES_REQUERIDAS', 422);
  }
}

export class CreditoNoAprobadoError extends DomainError {
  constructor(estado: EstadoSolicitud) {
    super('CREDITO_NO_APROBADO', 422, { estado });
  }
}

export class ParametrosCreditoInvalidosError extends DomainError {
  constructor(campo: CampoCredito) {
    super('PARAMETROS_CREDITO_INVALIDOS', 422, { campo });
  }
}

export class NoEncontradoError extends DomainError {
  constructor(recurso: Recurso) {
    super('NO_ENCONTRADO', 404, { recurso });
  }
}

export class TokenRevocadoError extends DomainError {
  constructor() {
    super('TOKEN_REVOCADO', 401);
  }
}

export class NoAutenticadoError extends DomainError {
  constructor() {
    super('NO_AUTENTICADO', 401);
  }
}
