import { NoAutenticadoError, Rol } from '@credito/domain';
import { describe, expect, it, vi } from 'vitest';
import { prepararAuth } from '../../testing/preparar-auth';

describe('Login', () => {
  it('emite una sesión y guarda solo el hash del refresh', async () => {
    const { uow, login } = prepararAuth();
    const sesion = await login.ejecutar('oficial', 'Demo2026!');
    expect(sesion).toEqual({
      accessToken: 'acceso:1:oficial:OFICIAL',
      refreshToken: 'refresh-1',
      refreshExpiraEn: new Date('2026-10-01T15:00:00Z'),
      usuario: { id: 1, username: 'oficial', rol: Rol.OFICIAL },
    });
    const [guardado] = [...uow.repos.refreshTokens.filas.values()];
    expect(guardado).toMatchObject({ tokenHash: 'sha:refresh-1', familiaId: 'familia-1', usuarioId: 1, revocadoEn: null });
  });

  it('rechaza una contraseña incorrecta', async () => {
    await expect(prepararAuth().login.ejecutar('oficial', 'otra')).rejects.toBeInstanceOf(NoAutenticadoError);
  });

  it('rechaza un usuario inexistente', async () => {
    await expect(prepararAuth().login.ejecutar('nadie', 'Demo2026!')).rejects.toBeInstanceOf(NoAutenticadoError);
  });

  it('compara contra un hash ficticio cuando el usuario no existe (tiempo constante)', async () => {
    const { hasher, login } = prepararAuth();
    const espia = vi.spyOn(hasher, 'comparar');
    await expect(login.ejecutar('nadie', 'Demo2026!')).rejects.toBeInstanceOf(NoAutenticadoError);
    expect(espia).toHaveBeenCalledTimes(1);
    expect(espia).toHaveBeenCalledWith('Demo2026!', expect.stringMatching(/^\$2[aby]?\$/));
  });
});
