import { NOMBRE_COOKIE_REFRESH } from '../../src/auth/infrastructure/cookie';
import { CONTRASENA_DEMO } from '../../src/shared/infrastructure/prisma/semilla';
import type { AppPrueba } from './app';

export function extraerCookieRefresh(respuesta: { headers: Record<string, unknown> }): string {
  const cookies = (respuesta.headers['set-cookie'] ?? []) as string[];
  const cookie = cookies.find((c) => c.startsWith(`${NOMBRE_COOKIE_REFRESH}=`));
  if (!cookie) throw new Error('La respuesta no trae cookie de refresh');
  return cookie.split(';')[0]!;
}

export async function iniciarSesion(app: AppPrueba, username: string): Promise<{ accessToken: string; cookie: string }> {
  const r = await app.agente().post('/api/v1/auth/login').send({ username, password: CONTRASENA_DEMO }).expect(200);
  return { accessToken: r.body.accessToken as string, cookie: extraerCookieRefresh(r) };
}
