import { describe, expect, it } from 'vitest';
import { PATRON_NOMBRE, PATRON_TELEFONO } from './formatos';

describe('PATRON_NOMBRE', () => {
  it.each(['Ana López', 'María José Ñúñez', "D'Angelo O'Neil", 'Jean-Luc Picard', 'J. R. Martínez'])('acepta %s', (v) => {
    expect(PATRON_NOMBRE.test(v)).toBe(true);
  });
  it.each(['Ana2', '123', ' Ana', '-Ana', 'Ana@López', 'Ana_López'])('rechaza %s', (v) => {
    expect(PATRON_NOMBRE.test(v)).toBe(false);
  });
});

describe('PATRON_TELEFONO', () => {
  it.each(['88887777', '8888-7777', '+505 8888 7777', '(505) 2222-3333', '+50588887777'])('acepta %s', (v) => {
    expect(PATRON_TELEFONO.test(v)).toBe(true);
  });
  it.each(['888-777', 'teléfono', '8888x7777', '++50588887777', '1234567890123456', '88887777 ext'])('rechaza %s', (v) => {
    expect(PATRON_TELEFONO.test(v)).toBe(false);
  });
});
