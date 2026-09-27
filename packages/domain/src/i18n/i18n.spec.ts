import { describe, expect, it } from 'vitest';
import { CODIGOS_ERROR, CODIGOS_VALIDACION } from './codigos';
import { normalizarLocale } from './locale';
import { MENSAJES } from './mensajes';
import { resolverMensaje } from './resolver-mensaje';

const TODOS = [...CODIGOS_ERROR, ...CODIGOS_VALIDACION];
const placeholders = (texto: string) =>
  [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('catálogo de mensajes', () => {
  it.each(TODOS)('%s tiene mensaje en es y en con los mismos placeholders', (code) => {
    expect(MENSAJES.es[code]).toBeTruthy();
    expect(MENSAJES.en[code]).toBeTruthy();
    expect(placeholders(MENSAJES.en[code])).toEqual(placeholders(MENSAJES.es[code]));
  });

  it.each(TODOS)('%s no deja placeholders sin reemplazar', (code) => {
    const params = Object.fromEntries(
      placeholders(MENSAJES.es[code]).map((clave) => [clave, 'x']),
    );
    expect(resolverMensaje(code, params, 'es')).not.toMatch(/\{\w+\}/);
    expect(resolverMensaje(code, params, 'en')).not.toMatch(/\{\w+\}/);
  });
});

describe('resolverMensaje', () => {
  it('interpola y traduce valores conocidos', () => {
    expect(resolverMensaje('TRANSICION_INVALIDA', { accion: 'aprobar', estado: 'APROBADA' }, 'es'))
      .toBe('No se puede aprobar una solicitud en estado aprobada');
    expect(resolverMensaje('TRANSICION_INVALIDA', { accion: 'aprobar', estado: 'APROBADA' }, 'en'))
      .toBe('Cannot approve an application in approved state');
    expect(resolverMensaje('NO_ENCONTRADO', { recurso: 'Credito' }, 'es'))
      .toBe('No se encontró el crédito');
    expect(resolverMensaje('NO_ENCONTRADO', { recurso: 'Credito' }, 'en'))
      .toBe('Credit not found');
    expect(resolverMensaje('EDAD_MAXIMA_EXCEDIDA', { edad: 81 }, 'es'))
      .toBe('El solicitante tiene 81 años; el máximo es 80');
  });

  it('usa ERROR_INTERNO para un código desconocido', () => {
    expect(resolverMensaje('NO_EXISTE', {}, 'en')).toBe(MENSAJES.en.ERROR_INTERNO);
  });

  it('usa es por defecto', () => {
    expect(resolverMensaje('PROHIBIDO')).toBe(MENSAJES.es.PROHIBIDO);
  });
});

describe('normalizarLocale', () => {
  it.each([
    [undefined, 'es'],
    [null, 'es'],
    ['', 'es'],
    ['en', 'en'],
    ['en-US,en;q=0.9', 'en'],
    ['fr-FR,en;q=0.8', 'en'],
    ['fr-FR', 'es'],
    ['ES-ni', 'es'],
    [['en-GB'], 'en'],
  ])('%s → %s', (entrada, esperado) => {
    expect(normalizarLocale(entrada as string | string[] | null | undefined)).toBe(esperado);
  });
});
