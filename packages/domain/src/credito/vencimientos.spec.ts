import { describe, expect, it } from 'vitest';
import { Periodicidad } from './periodicidad';
import { fechaVencimiento } from './vencimientos';

describe('fechaVencimiento', () => {
  it.each([
    ['2026-01-31', Periodicidad.MENSUAL, 1, '2026-02-28'],
    ['2026-01-31', Periodicidad.MENSUAL, 2, '2026-03-31'],
    ['2026-01-31', Periodicidad.MENSUAL, 12, '2027-01-31'],
    ['2026-01-10', Periodicidad.QUINCENAL, 1, '2026-01-25'],
    ['2026-01-10', Periodicidad.QUINCENAL, 2, '2026-02-10'],
    ['2026-01-10', Periodicidad.QUINCENAL, 3, '2026-02-25'],
    ['2026-01-10', Periodicidad.QUINCENAL, 24, '2027-01-10'],
    ['2024-02-29', Periodicidad.ANUAL, 1, '2025-02-28'],
  ])('base %s %s cuota %d vence %s', (base, periodicidad, numero, esperado) => {
    expect(fechaVencimiento(base, periodicidad, numero)).toBe(esperado);
  });

  it('una base a fin de mes produce vencimientos quincenales estrictamente crecientes', () => {
    const fechas = Array.from({ length: 48 }, (_, k) =>
      fechaVencimiento('2026-01-31', Periodicidad.QUINCENAL, k + 1),
    );
    for (let k = 1; k < fechas.length; k++) {
      expect(fechas[k]! > fechas[k - 1]!).toBe(true);
    }
  });
});
