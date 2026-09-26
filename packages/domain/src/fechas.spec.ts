import { describe, expect, it } from 'vitest';
import {
  diasEnMes, esFechaValida, fechaEnZona, formatearFecha,
  parsearFecha, sumarDias, sumarMeses,
} from './fechas';

describe('fechas', () => {
  it('valida el formato YYYY-MM-DD y fechas reales', () => {
    expect(esFechaValida('2026-02-28')).toBe(true);
    expect(esFechaValida('2024-02-29')).toBe(true);
    expect(esFechaValida('2026-02-29')).toBe(false);
    expect(esFechaValida('2026-13-01')).toBe(false);
    expect(esFechaValida('26-01-01')).toBe(false);
    expect(esFechaValida('2026-1-01')).toBe(false);
  });

  it('parsea y formatea', () => {
    expect(parsearFecha('2026-09-24')).toEqual({ anio: 2026, mes: 9, dia: 24 });
    expect(formatearFecha(2026, 1, 5)).toBe('2026-01-05');
    expect(() => parsearFecha('2026-02-30')).toThrow(RangeError);
  });

  it('calcula los días de cada mes', () => {
    expect(diasEnMes(2026, 2)).toBe(28);
    expect(diasEnMes(2024, 2)).toBe(29);
    expect(diasEnMes(2026, 4)).toBe(30);
    expect(diasEnMes(2026, 12)).toBe(31);
  });

  it('suma meses recortando al último día del mes', () => {
    expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(sumarMeses('2026-01-31', 2)).toBe('2026-03-31');
    expect(sumarMeses('2026-01-31', 12)).toBe('2027-01-31');
    expect(sumarMeses('2024-02-29', 12)).toBe('2025-02-28');
    expect(sumarMeses('2026-11-15', 3)).toBe('2027-02-15');
  });

  it('suma días cruzando meses y años', () => {
    expect(sumarDias('2026-01-10', 15)).toBe('2026-01-25');
    expect(sumarDias('2026-02-28', 15)).toBe('2026-03-15');
    expect(sumarDias('2026-12-20', 15)).toBe('2027-01-04');
  });

  it('obtiene la fecha local de una zona horaria', () => {
    const instante = new Date('2026-09-25T01:00:00Z');
    expect(fechaEnZona(instante, 'America/Managua')).toBe('2026-09-24');
    expect(fechaEnZona(instante, 'UTC')).toBe('2026-09-25');
  });
});
