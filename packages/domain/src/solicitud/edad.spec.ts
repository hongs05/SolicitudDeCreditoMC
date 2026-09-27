import { describe, expect, it } from 'vitest';
import { AntiguedadInconsistenteError, EdadMaximaExcedidaError, EdadMinimaNoAlcanzadaError } from '../errors/errores';
import { calcularEdad, validarAntiguedad, validarEdad } from './edad';

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

describe('validarEdad', () => {
  it('acepta exactamente 80 años', () => {
    expect(validarEdad('1946-01-01', '2026-09-24')).toBe(80);
  });

  it('rechaza 81 años con la edad en los parámetros', () => {
    expect(() => validarEdad('1945-09-24', '2026-09-24')).toThrow(EdadMaximaExcedidaError);
    try {
      validarEdad('1945-09-24', '2026-09-24');
    } catch (error) {
      expect((error as EdadMaximaExcedidaError).params).toEqual({ edad: 81 });
    }
  });
});

describe('validarEdad: mínimo', () => {
  it('acepta el día en que cumple 18 años', () => {
    expect(validarEdad('2008-09-24', '2026-09-24')).toBe(18);
  });

  it('rechaza a un menor de 18 con la edad en los parámetros', () => {
    const accion = () => validarEdad('2008-09-25', '2026-09-24');
    expect(accion).toThrow(EdadMinimaNoAlcanzadaError);
    try {
      accion();
    } catch (error) {
      expect((error as EdadMinimaNoAlcanzadaError).params).toEqual({ edad: 17, min: 18 });
    }
  });
});

describe('validarAntiguedad', () => {
  it('acepta hasta los años trabajados desde los 14', () => {
    expect(() => validarAntiguedad(16, 30)).not.toThrow();
  });

  it('rechaza más antigüedad de la posible para la edad', () => {
    const accion = () => validarAntiguedad(17, 30);
    expect(accion).toThrow(AntiguedadInconsistenteError);
    try {
      accion();
    } catch (error) {
      expect((error as AntiguedadInconsistenteError).params).toEqual({ max: 16, edad: 30 });
    }
  });
});
