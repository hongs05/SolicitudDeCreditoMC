import { esFechaValida } from '@credito/domain';
import { Length, Max, Min, registerDecorator } from 'class-validator';

const PATRON_DECIMAL = /^\d+(\.\d{1,2})?$/;
const esDecimalValido = (valor: unknown): valor is string =>
  typeof valor === 'string' && PATRON_DECIMAL.test(valor);

function restriccion(nombre: string, validar: (valor: unknown) => boolean, context?: Record<string, unknown>) {
  return (objeto: object, propiedad: string) =>
    registerDecorator({
      name: nombre,
      target: objeto.constructor,
      propertyName: propiedad,
      options: { context },
      // class-validator solo asocia el `context` de una restricción cuando su mensaje
      // por defecto no es una cadena vacía (mira la verdad del mensaje, no si existe).
      // Sin este `defaultMessage`, `error.contexts[nombre]` nunca se completa.
      validator: { validate: validar, defaultMessage: () => nombre },
    });
}

export const Longitud = (min: number, max: number) => Length(min, max, { context: { min, max } });
export const Minimo = (min: number) => Min(min, { context: { min } });
export const Maximo = (max: number) => Max(max, { context: { max } });

export const EsDecimal = () => restriccion('esDecimal', esDecimalValido);

export const DecimalMinimo = (min: number) =>
  restriccion('decimalMinimo', (v) => !esDecimalValido(v) || Number(v) >= min, { min });

export const DecimalMaximo = (max: number) =>
  restriccion('decimalMaximo', (v) => !esDecimalValido(v) || Number(v) <= max, { max });

export const EsFechaPasada = () =>
  restriccion(
    'fechaPasada',
    (v) => typeof v === 'string' && esFechaValida(v) && v < new Date().toISOString().slice(0, 10),
  );
