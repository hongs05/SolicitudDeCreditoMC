import { Periodicidad } from '@credito/domain';
import { describe, expect, it } from 'vitest';
import { es } from '../i18n/es';
import { interpolar } from '../i18n/I18nProvider';
import { formatearDinero, formatearFecha, textoPlazo } from './formato';

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
});
