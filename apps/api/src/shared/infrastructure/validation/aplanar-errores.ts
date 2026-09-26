import type { CodigoValidacion } from '@credito/domain';
import type { ValidationError } from 'class-validator';
import type { DetalleValidacion } from './validacion.exception';

const CODIGO_POR_RESTRICCION: Record<string, CodigoValidacion> = {
  isNotEmpty: 'REQUERIDO',
  isDefined: 'REQUERIDO',
  isEmail: 'CORREO_INVALIDO',
  min: 'VALOR_MINIMO',
  decimalMinimo: 'VALOR_MINIMO',
  max: 'VALOR_MAXIMO',
  decimalMaximo: 'VALOR_MAXIMO',
  isLength: 'LONGITUD_INVALIDA',
  minLength: 'LONGITUD_INVALIDA',
  maxLength: 'LONGITUD_INVALIDA',
  isInt: 'ENTERO_REQUERIDO',
  fechaPasada: 'FECHA_INVALIDA',
  isDateString: 'FECHA_INVALIDA',
  matches: 'FORMATO_INVALIDO',
  esDecimal: 'FORMATO_INVALIDO',
  isEnum: 'VALOR_NO_PERMITIDO',
  isIn: 'VALOR_NO_PERMITIDO',
  whitelistValidation: 'VALOR_NO_PERMITIDO',
};

const PRIORIDAD: CodigoValidacion[] = [
  'REQUERIDO',
  'FORMATO_INVALIDO',
  'ENTERO_REQUERIDO',
  'FECHA_INVALIDA',
  'CORREO_INVALIDO',
];

const rango = (code: CodigoValidacion) => {
  const posicion = PRIORIDAD.indexOf(code);
  return posicion === -1 ? PRIORIDAD.length : posicion;
};

function elegir(error: ValidationError, campo: string): DetalleValidacion {
  const candidatos = Object.keys(error.constraints ?? {}).map((restriccion) => ({
    restriccion,
    code: CODIGO_POR_RESTRICCION[restriccion] ?? 'VALOR_INVALIDO',
  }));
  candidatos.sort((a, b) => rango(a.code) - rango(b.code));
  const elegido = candidatos[0]!;
  const params = (error.contexts?.[elegido.restriccion] ?? {}) as Record<string, unknown>;
  return { field: campo, code: elegido.code, params };
}

export function aplanarErrores(errores: ValidationError[], prefijo = ''): DetalleValidacion[] {
  return errores.flatMap((error) => {
    const campo = prefijo ? `${prefijo}.${error.property}` : error.property;
    const propios = error.constraints && Object.keys(error.constraints).length > 0 ? [elegir(error, campo)] : [];
    return [...propios, ...aplanarErrores(error.children ?? [], campo)];
  });
}
