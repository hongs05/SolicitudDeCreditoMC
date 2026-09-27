import { NoAutenticadoError, TokenRevocadoError } from '@credito/domain';
import { describe, expect, it } from 'vitest';
import { prepararAuth } from '../../testing/preparar-auth';
import { RefrescarSesion } from './refrescar-sesion.use-case';

const preparar = () => {
  const base = prepararAuth();
  const refrescar = new RefrescarSesion(base.uow, base.tokens, base.secretos, base.opciones, base.reloj);
  return { ...base, refrescar };
};

const filaPorHash = (p: ReturnType<typeof preparar>, hash: string) =>
  [...p.uow.repos.refreshTokens.filas.values()].find((f) => f.tokenHash === hash)!;

describe('RefrescarSesion', () => {
  it('rota el token dentro de la misma familia', async () => {
    const p = preparar();
    await p.login.ejecutar('oficial', 'Demo2026!');
    const sesion = await p.refrescar.ejecutar('refresh-1');

    expect(sesion.refreshToken).toBe('refresh-2');
    const viejo = filaPorHash(p, 'sha:refresh-1');
    const nuevo = filaPorHash(p, 'sha:refresh-2');
    expect(viejo.revocadoEn).not.toBeNull();
    expect(viejo.reemplazadoPorId).toBe(nuevo.id);
    expect(nuevo).toMatchObject({ familiaId: viejo.familiaId, revocadoEn: null });
  });

  it('ante un reuso revoca toda la familia', async () => {
    const p = preparar();
    await p.login.ejecutar('oficial', 'Demo2026!');
    await p.refrescar.ejecutar('refresh-1');

    await expect(p.refrescar.ejecutar('refresh-1')).rejects.toBeInstanceOf(TokenRevocadoError);
    expect(filaPorHash(p, 'sha:refresh-2').revocadoEn).not.toBeNull();
    await expect(p.refrescar.ejecutar('refresh-2')).rejects.toBeInstanceOf(TokenRevocadoError);
  });

  it('un token expirado se revoca y devuelve NO_AUTENTICADO', async () => {
    const p = preparar();
    await p.login.ejecutar('oficial', 'Demo2026!');
    p.reloj.fijar(new Date('2026-10-02T00:00:00Z'), '2026-10-01');

    await expect(p.refrescar.ejecutar('refresh-1')).rejects.toBeInstanceOf(NoAutenticadoError);
    expect(filaPorHash(p, 'sha:refresh-1').revocadoEn).not.toBeNull();
  });

  it('sin cookie o con un valor desconocido devuelve NO_AUTENTICADO', async () => {
    const p = preparar();
    await expect(p.refrescar.ejecutar(undefined)).rejects.toBeInstanceOf(NoAutenticadoError);
    await expect(p.refrescar.ejecutar('inventado')).rejects.toBeInstanceOf(NoAutenticadoError);
  });
});
