import { describe, expect, it } from 'vitest';
import { ParametrosCreditoInvalidosError } from '../errors/errores';
import { calcularCuotaNivelada, tasaPeriodica, validarCondiciones } from './cuota-nivelada';
import { aCentavos, aUnidades } from './dinero';
import { esPeriodicidad, Periodicidad, PERIODOS_POR_ANIO } from './periodicidad';

describe('periodicidad', () => {
  it('usa n = 1, 12 y 24', () => {
    expect(PERIODOS_POR_ANIO).toEqual({ ANUAL: 1, MENSUAL: 12, QUINCENAL: 24 });
  });

  it('reconoce valores válidos', () => {
    expect(esPeriodicidad('MENSUAL')).toBe(true);
    expect(esPeriodicidad('SEMANAL')).toBe(false);
  });
});

describe('dinero', () => {
  it('convierte a centavos redondeando', () => {
    expect(aCentavos(10000)).toBe(1_000_000);
    expect(aCentavos(0.1 + 0.2)).toBe(30);
    expect(aCentavos(1.005)).toBe(100);
    expect(aUnidades(88849)).toBe(888.49);
  });
});

describe('tasaPeriodica', () => {
  it.each([
    [12, Periodicidad.MENSUAL, 0.01],
    [24, Periodicidad.QUINCENAL, 0.01],
    [10, Periodicidad.ANUAL, 0.1],
    [0, Periodicidad.MENSUAL, 0],
  ])('%d %% %s → %d', (tasa, periodicidad, esperado) => {
    expect(tasaPeriodica(tasa, periodicidad)).toBeCloseTo(esperado, 12);
  });
});

describe('calcularCuotaNivelada', () => {
  it.each([
    ['A', 10000, 12, 12, Periodicidad.MENSUAL, 888.49],
    ['B', 1000, 0, 3, Periodicidad.MENSUAL, 333.33],
    ['C', 5000, 10, 2, Periodicidad.ANUAL, 2880.95],
    ['D', 2000, 24, 24, Periodicidad.QUINCENAL, 94.15],
  ])('caso %s', (_caso, monto, tasaAnual, cuotas, periodicidad, esperado) => {
    expect(calcularCuotaNivelada({ monto, tasaAnual, cuotas, periodicidad })).toBe(esperado);
  });

  it('una sola cuota sin interés devuelve el monto', () => {
    expect(calcularCuotaNivelada({ monto: 500, tasaAnual: 0, cuotas: 1, periodicidad: Periodicidad.ANUAL })).toBe(500);
  });

  it('rechaza una combinación que no amortiza (cuota no supera el interés del primer periodo)', () => {
    const accion = () =>
      calcularCuotaNivelada({ monto: 10000, tasaAnual: 100, cuotas: 360, periodicidad: Periodicidad.MENSUAL });
    expect(accion).toThrow(ParametrosCreditoInvalidosError);
    try {
      accion();
    } catch (error) {
      expect((error as ParametrosCreditoInvalidosError).params).toEqual({ campo: 'tasaAnual' });
    }
  });

  it('acepta una combinación de tasa y plazo alto que sí amortiza', () => {
    const cuota = calcularCuotaNivelada({ monto: 20000, tasaAnual: 30, cuotas: 30, periodicidad: Periodicidad.ANUAL });
    expect(cuota).toBeGreaterThan(6000);
  });
});

describe('validarCondiciones', () => {
  const base = { monto: 1000, tasaAnual: 12, cuotas: 12, periodicidad: Periodicidad.MENSUAL };

  it.each([
    [{ monto: 0 }, 'monto'],
    [{ monto: -5 }, 'monto'],
    [{ monto: Number.NaN }, 'monto'],
    [{ cuotas: 0 }, 'cuotas'],
    [{ cuotas: 1.5 }, 'cuotas'],
    [{ tasaAnual: -1 }, 'tasaAnual'],
    [{ tasaAnual: 100.01 }, 'tasaAnual'],
    [{ periodicidad: 'SEMANAL' as Periodicidad }, 'periodicidad'],
    [{ cuotas: 31, periodicidad: Periodicidad.ANUAL }, 'cuotas'],
    [{ cuotas: 361, periodicidad: Periodicidad.MENSUAL }, 'cuotas'],
    [{ monto: 0.004 }, 'monto'],
  ])('%o falla en %s', (cambio, campo) => {
    const accion = () => validarCondiciones({ ...base, ...cambio });
    expect(accion).toThrow(ParametrosCreditoInvalidosError);
    try {
      accion();
    } catch (error) {
      expect((error as ParametrosCreditoInvalidosError).params).toEqual({ campo });
    }
  });

  it('acepta tasa 0 y tasa 100', () => {
    expect(() => validarCondiciones({ ...base, tasaAnual: 0 })).not.toThrow();
    expect(() => validarCondiciones({ ...base, tasaAnual: 100 })).not.toThrow();
  });

  it('acepta el plazo máximo de 30 años en cada periodicidad', () => {
    expect(() => validarCondiciones({ ...base, cuotas: 30, periodicidad: Periodicidad.ANUAL })).not.toThrow();
    expect(() => validarCondiciones({ ...base, cuotas: 360, periodicidad: Periodicidad.MENSUAL })).not.toThrow();
    expect(() => validarCondiciones({ ...base, cuotas: 720, periodicidad: Periodicidad.QUINCENAL })).not.toThrow();
  });
});
