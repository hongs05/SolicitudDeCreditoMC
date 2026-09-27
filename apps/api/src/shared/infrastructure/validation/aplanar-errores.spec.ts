import type { ValidationError } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { aplanarErrores } from './aplanar-errores';

const error = (
  property: string,
  constraints: Record<string, string>,
  contexts?: Record<string, unknown>,
  children: ValidationError[] = [],
): ValidationError => ({ property, constraints, contexts, children }) as ValidationError;

describe('aplanarErrores', () => {
  it('prioriza REQUERIDO sobre otras restricciones', () => {
    expect(aplanarErrores([error('nombre', { isString: 'x', isNotEmpty: 'x', isLength: 'x' })]))
      .toEqual([{ field: 'nombre', code: 'REQUERIDO', params: {} }]);
  });

  it('prioriza FORMATO_INVALIDO sobre rangos', () => {
    expect(aplanarErrores([error('monto', { decimalMinimo: 'x', esDecimal: 'x' })])[0]!.code)
      .toBe('FORMATO_INVALIDO');
  });

  it('toma los parámetros del contexto de la restricción elegida', () => {
    expect(aplanarErrores([error('nombre', { isLength: 'x' }, { isLength: { min: 3, max: 10 } })]))
      .toEqual([{ field: 'nombre', code: 'LONGITUD_INVALIDA', params: { min: 3, max: 10 } }]);
  });

  it.each([
    ['isEmail', 'CORREO_INVALIDO'],
    ['min', 'VALOR_MINIMO'],
    ['decimalMaximo', 'VALOR_MAXIMO'],
    ['isInt', 'ENTERO_REQUERIDO'],
    ['fechaPasada', 'FECHA_INVALIDA'],
    ['matches', 'FORMATO_INVALIDO'],
    ['isEnum', 'VALOR_NO_PERMITIDO'],
    ['whitelistValidation', 'VALOR_NO_PERMITIDO'],
    ['algoRaro', 'VALOR_INVALIDO'],
  ])('%s → %s', (restriccion, code) => {
    expect(aplanarErrores([error('campo', { [restriccion]: 'x' })])[0]!.code).toBe(code);
  });

  it('recorre objetos anidados con rutas con punto', () => {
    const anidado = error('direccion', {}, undefined, [error('ciudad', { isNotEmpty: 'x' })]);
    delete (anidado as { constraints?: unknown }).constraints;
    expect(aplanarErrores([anidado])).toEqual([{ field: 'direccion.ciudad', code: 'REQUERIDO', params: {} }]);
  });
});
