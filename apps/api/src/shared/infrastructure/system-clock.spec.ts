import { describe, expect, it } from 'vitest';
import { SystemClock } from './system-clock';

describe('SystemClock', () => {
  it('hoy devuelve la fecha local de la zona configurada', () => {
    const instante = new Date('2026-09-25T01:00:00Z');
    const reloj = new SystemClock('America/Managua', () => instante);
    expect(reloj.ahora()).toBe(instante);
    expect(reloj.hoy()).toBe('2026-09-24');
  });
});
