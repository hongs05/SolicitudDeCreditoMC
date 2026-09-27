import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type AppPrueba, crearAppPrueba } from './helpers/app';
import { extraerCookieRefresh, iniciarSesion } from './helpers/sesiones';

describe('autenticación', () => {
  let app: AppPrueba;

  beforeAll(async () => {
    app = await crearAppPrueba();
  });
  afterAll(async () => {
    await app.cerrar();
  });

  it('login devuelve access, usuario y cookie httpOnly restringida', async () => {
    const r = await app.agente().post('/api/v1/auth/login').send({ username: 'oficial', password: 'Demo2026!' }).expect(200);
    expect(r.body).toEqual({
      accessToken: expect.any(String),
      usuario: { id: expect.any(Number), username: 'oficial', rol: 'OFICIAL' },
    });
    expect(r.body.refreshToken).toBeUndefined();
    const cookie = (r.headers['set-cookie'] as unknown as string[])[0]!;
    expect(cookie).toMatch(/^refresh_token=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
  });

  it('credenciales incorrectas dan 401 traducido', async () => {
    const es = await app.agente().post('/api/v1/auth/login').send({ username: 'oficial', password: 'mala' }).expect(401);
    expect(es.body).toMatchObject({ code: 'NO_AUTENTICADO', message: 'Usuario o contraseña incorrectos, o la sesión ha expirado' });
    const en = await app.agente()
      .post('/api/v1/auth/login').set('Accept-Language', 'en')
      .send({ username: 'nadie', password: 'x' }).expect(401);
    expect(en.body.message).toBe('Incorrect username or password, or the session has expired');
  });

  it('login sin campos da 400 con detalles', async () => {
    const r = await app.agente().post('/api/v1/auth/login').send({}).expect(400);
    expect(r.body.details).toHaveLength(2);
  });

  it('me exige un bearer válido', async () => {
    await app.agente().get('/api/v1/auth/me').expect(401);
    await app.agente().get('/api/v1/auth/me').set('Authorization', 'Bearer basura').expect(401);
    const { accessToken } = await iniciarSesion(app, 'cajero');
    const r = await app.agente().get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(r.body).toMatchObject({ username: 'cajero', rol: 'CAJERO' });
  });

  it('refresh rota la cookie y el reuso revoca la familia', async () => {
    const { cookie } = await iniciarSesion(app, 'analista');
    const r = await app.agente().post('/api/v1/auth/refresh').set('Cookie', cookie).expect(200);
    expect(r.body.usuario.username).toBe('analista');
    const nueva = extraerCookieRefresh(r);
    expect(nueva).not.toBe(cookie);

    const reuso = await app.agente().post('/api/v1/auth/refresh').set('Cookie', cookie).expect(401);
    expect(reuso.body.code).toBe('TOKEN_REVOCADO');
    const despues = await app.agente().post('/api/v1/auth/refresh').set('Cookie', nueva).expect(401);
    expect(despues.body.code).toBe('TOKEN_REVOCADO');
  });

  it('dos refresh simultáneos con la misma cookie: uno rota y el otro revoca, sin 500', async () => {
    const { cookie } = await iniciarSesion(app, 'admin');
    const respuestas = await Promise.all([
      app.agente().post('/api/v1/auth/refresh').set('Cookie', cookie),
      app.agente().post('/api/v1/auth/refresh').set('Cookie', cookie),
    ]);
    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 401]);
    expect(respuestas.find((r) => r.status === 401)!.body.code).toBe('TOKEN_REVOCADO');
  });

  it('refresh sin cookie da NO_AUTENTICADO', async () => {
    const r = await app.agente().post('/api/v1/auth/refresh').expect(401);
    expect(r.body.code).toBe('NO_AUTENTICADO');
  });

  it('logout borra la cookie y revoca la familia', async () => {
    const { accessToken, cookie } = await iniciarSesion(app, 'oficial');
    const r = await app.agente()
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookie)
      .expect(204);
    expect((r.headers['set-cookie'] as unknown as string[])[0]).toMatch(/refresh_token=;.*Expires=Thu, 01 Jan 1970/);
    const despues = await app.agente().post('/api/v1/auth/refresh').set('Cookie', cookie).expect(401);
    expect(despues.body.code).toBe('TOKEN_REVOCADO');
  });
});
