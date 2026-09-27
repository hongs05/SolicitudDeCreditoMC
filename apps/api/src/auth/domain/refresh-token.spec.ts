import { describe, expect, it } from 'vitest';
import { RefreshToken } from './refresh-token';

const AHORA = new Date('2026-09-24T15:00:00Z');
const emitir = () =>
  RefreshToken.emitir({ usuarioId: 1, familiaId: 'f1', tokenHash: 'h1', ahora: AHORA, ttlDias: 7 });

describe('RefreshToken', () => {
  it('emite con expiración a los días configurados', () => {
    expect(emitir().snapshot()).toEqual({
      id: null,
      usuarioId: 1,
      familiaId: 'f1',
      tokenHash: 'h1',
      creadoEn: AHORA,
      expiraEn: new Date('2026-10-01T15:00:00Z'),
      revocadoEn: null,
      reemplazadoPorId: null,
    });
  });

  it('está vigente hasta su expiración', () => {
    const token = emitir();
    expect(token.estaVigente(new Date('2026-10-01T14:59:59Z'))).toBe(true);
    expect(token.estaVigente(new Date('2026-10-01T15:00:00Z'))).toBe(false);
  });

  it('revocar es idempotente y conserva la primera fecha', () => {
    const token = emitir();
    token.revocar(AHORA);
    token.revocar(new Date('2026-09-30T00:00:00Z'));
    expect(token.estaRevocado()).toBe(true);
    expect(token.snapshot().revocadoEn).toEqual(AHORA);
    expect(token.estaVigente(AHORA)).toBe(false);
  });

  it('rotar revoca y apunta al reemplazo', () => {
    const token = emitir();
    token.rotar(42, AHORA);
    expect(token.snapshot()).toMatchObject({ revocadoEn: AHORA, reemplazadoPorId: 42 });
  });
});
