import { describe, expect, it } from 'vitest';
import { EdadMaximaExcedidaError } from '../errors/errores';
import { calcularEdad, validarEdadMaxima } from './edad';

describe('calcularEdad', () => {
  it.each([
    ['1946-01-01', '2026-09-24', 80],
    ['1945-09-24', '2026-09-24', 81],
    ['1945-09-25', '2026-09-24', 80],
    ['2000-02-29', '2027-02-28', 26],
    ['2000-02-29', '2027-03-01', 27],
  ])('nace %s, hoy %s → %d', (nacimiento, hoy, esperado) => {
    expect(calcularEdad(nacimiento, hoy)).toBe(esperado);
  });
});

describe('validarEdadMaxima', () => {
  it('acepta exactamente 80 años', () => {
    expect(validarEdadMaxima('1946-01-01', '2026-09-24')).toBe(80);
  });

  it('rechaza 81 años con la edad en los parámetros', () => {
    expect(() => validarEdadMaxima('1945-09-24', '2026-09-24')).toThrow(EdadMaximaExcedidaError);
    try {
      validarEdadMaxima('1945-09-24', '2026-09-24');
    } catch (error) {
      expect((error as EdadMaximaExcedidaError).params).toEqual({ edad: 81 });
    }
  });
});
