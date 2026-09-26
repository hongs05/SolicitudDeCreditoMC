import { describe, expect, it } from 'vitest';
import { cargarConfiguracion } from './configuracion';

const minima = { DATABASE_URL: 'file:/tmp/x.db', JWT_SECRET: 'x'.repeat(32) };

describe('cargarConfiguracion', () => {
  it('aplica valores por defecto', () => {
    expect(cargarConfiguracion(minima)).toEqual({
      databaseUrl: 'file:/tmp/x.db',
      jwtSecret: 'x'.repeat(32),
      jwtAccessTtlSegundos: 900,
      refreshTtlDias: 7,
      cookieSecure: false,
      zonaHoraria: 'America/Managua',
      puerto: 3000,
    });
  });

  it('lee valores explícitos', () => {
    const config = cargarConfiguracion({
      ...minima,
      JWT_ACCESS_TTL: '2h',
      REFRESH_TTL_DAYS: '3',
      COOKIE_SECURE: 'true',
      APP_TZ: 'UTC',
      PORT: '4000',
    });
    expect(config).toMatchObject({
      jwtAccessTtlSegundos: 7200,
      refreshTtlDias: 3,
      cookieSecure: true,
      zonaHoraria: 'UTC',
      puerto: 4000,
    });
  });

  it('reúne todos los errores en un solo mensaje', () => {
    expect(() => cargarConfiguracion({})).toThrow(/DATABASE_URL[\s\S]*JWT_SECRET/);
  });

  it.each([
    ['JWT_SECRET', 'corto'],
    ['JWT_ACCESS_TTL', '15x'],
    ['JWT_ACCESS_TTL', '0m'],
    ['REFRESH_TTL_DAYS', '0'],
    ['COOKIE_SECURE', 'si'],
    ['APP_TZ', 'Marte/Base'],
    ['PORT', 'abc'],
  ])('rechaza %s=%s', (variable, valor) => {
    expect(() => cargarConfiguracion({ ...minima, [variable]: valor })).toThrow(variable);
  });
});
