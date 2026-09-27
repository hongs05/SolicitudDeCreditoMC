import { Periodicidad } from '@credito/domain';
import { describe, expect, it } from 'vitest';
import { es } from '../i18n/es';
import { interpolar } from '../i18n/I18nProvider';
import { diasDesde, formatearDinero, formatearFecha, formatearRelativo, formatearTasa, numeroSolicitud, textoPlazo } from './formato';

const t = (clave: keyof typeof es, params?: Record<string, string | number>) => interpolar(es[clave], params);

describe('formato', () => {
  it('formatea dinero con el símbolo de córdobas', () => {
    expect(formatearDinero(888.49, 'es')).toMatch(/^C\$ 888[.,]49$/);
    expect(formatearDinero('10000.00', 'en')).toBe('C$ 10,000.00');
  });

  it('formatea fechas de calendario sin desfase de zona horaria', () => {
    expect(formatearFecha('2026-01-01', 'en')).toBe('Jan 1, 2026');
  });

  it.each([
    [24, Periodicidad.QUINCENAL, '24 cuotas quincenales'],
    [12, Periodicidad.MENSUAL, '12 cuotas mensuales'],
    [1, Periodicidad.ANUAL, '1 cuota anual'],
  ])('%d %s → %s', (cuotas, periodicidad, esperado) => {
    expect(textoPlazo(cuotas, periodicidad, t)).toBe(esperado);
  });

  it('formatea la tasa según el idioma', () => {
    expect(formatearTasa('12.50', 'en')).toBe('12.5 %');
    expect(formatearTasa('24.00', 'es')).toBe('24 %');
  });

  it('numera las solicitudes con cuatro dígitos', () => {
    expect(numeroSolicitud(7)).toBe('#0007');
    expect(numeroSolicitud(12345)).toBe('#12345');
  });

  it('expresa instantes en tiempo relativo', () => {
    const ahora = new Date('2026-09-27T12:00:00Z');
    expect(formatearRelativo('2026-09-25T12:00:00Z', 'es', ahora)).toBe('anteayer');
    expect(formatearRelativo('2026-09-24T12:00:00Z', 'en', ahora)).toBe('3 days ago');
    expect(formatearRelativo('2026-09-27T11:59:30Z', 'en', ahora)).toBe('now');
  });

  it('cuenta días completos de espera', () => {
    const ahora = new Date('2026-09-27T12:00:00Z');
    expect(diasDesde('2026-09-27T01:00:00Z', ahora)).toBe(0);
    expect(diasDesde('2026-09-24T11:00:00Z', ahora)).toBe(3);
  });
});
