import {
  type ArgumentsHost, Catch, type ExceptionFilter, HttpException, Logger,
} from '@nestjs/common';
import { type CodigoError, esDomainError, normalizarLocale, resolverMensaje } from '@credito/domain';
import type { Request, Response } from 'express';
import { type DetalleValidacion, ValidacionException } from '../validation/validacion.exception';

export interface Clasificacion {
  statusCode: number;
  code: CodigoError;
  params: Record<string, unknown>;
  detalles?: DetalleValidacion[];
}

export function clasificar(excepcion: unknown): Clasificacion {
  if (esDomainError(excepcion)) {
    return { statusCode: excepcion.httpStatus, code: excepcion.code, params: excepcion.params };
  }
  if (excepcion instanceof ValidacionException) {
    return { statusCode: 400, code: 'VALIDACION', params: {}, detalles: excepcion.detalles };
  }
  if (excepcion instanceof HttpException) {
    const statusCode = excepcion.getStatus();
    if (statusCode === 401) return { statusCode, code: 'NO_AUTENTICADO', params: {} };
    if (statusCode === 403) return { statusCode, code: 'PROHIBIDO', params: {} };
    if (statusCode === 404) return { statusCode, code: 'NO_ENCONTRADO', params: { recurso: 'Recurso' } };
    if (statusCode < 500) return { statusCode, code: 'VALIDACION', params: {} };
  }
  return { statusCode: 500, code: 'ERROR_INTERNO', params: {} };
}

@Catch()
export class ErrorHandlerFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorHandlerFilter.name);

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const peticion = http.getRequest<Request>();
    const respuesta = http.getResponse<Response>();
    const locale = normalizarLocale(peticion.headers['accept-language']);
    const { statusCode, code, params, detalles } = clasificar(excepcion);

    if (statusCode >= 500) {
      const detalle = excepcion instanceof Error ? excepcion.stack : String(excepcion);
      this.logger.error(`${peticion.method} ${peticion.url}`, detalle);
    }

    respuesta.status(statusCode).json({
      statusCode,
      code,
      message: resolverMensaje(code, params, locale),
      ...(Object.keys(params).length > 0 ? { params } : {}),
      ...(detalles
        ? {
            details: detalles.map((d) => ({
              field: d.field,
              code: d.code,
              message: resolverMensaje(d.code, d.params, locale),
            })),
          }
        : {}),
      timestamp: new Date().toISOString(),
      path: peticion.url,
    });
  }
}
