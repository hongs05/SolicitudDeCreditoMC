import { describe, expect, it } from 'vitest';
import { prepararAuth } from '../../testing/preparar-auth';
import { CerrarSesion } from './cerrar-sesion.use-case';

describe('CerrarSesion', () => {
  it('revoca toda la familia del token', async () => {
    const p = prepararAuth();
    await p.login.ejecutar('oficial', 'Demo2026!');
    await new CerrarSesion(p.uow, p.secretos, p.reloj).ejecutar('refresh-1');
    expect([...p.uow.repos.refreshTokens.filas.values()].every((f) => f.revocadoEn !== null)).toBe(true);
  });

  it('sin cookie no hace nada', async () => {
    const p = prepararAuth();
    await new CerrarSesion(p.uow, p.secretos, p.reloj).ejecutar(undefined);
    expect(p.uow.ejecuciones).toBe(0);
  });
});
