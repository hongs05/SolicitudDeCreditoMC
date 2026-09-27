import { describe, expect, it } from 'vitest';
import { en } from './en';
import { es } from './es';
import { interpolar } from './I18nProvider';

const placeholders = (texto: string) => [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('diccionarios', () => {
  it.each(Object.keys(es))('%s tiene los mismos placeholders en es y en', (clave) => {
    const k = clave as keyof typeof es;
    expect(en[k]).toBeTruthy();
    expect(placeholders(en[k])).toEqual(placeholders(es[k]));
  });

  it('interpola parámetros y deja intactos los ausentes', () => {
    expect(interpolar('Hola {nombre}, {x}', { nombre: 'Ana' })).toBe('Hola Ana, {x}');
  });
});
