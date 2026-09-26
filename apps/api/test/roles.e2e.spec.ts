import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type AppPrueba, crearAppPrueba } from './helpers/app';
import { iniciarSesion } from './helpers/sesiones';

type Rol = 'OFICIAL' | 'ANALISTA' | 'CAJERO' | 'ADMIN';
const TODOS: Rol[] = ['OFICIAL', 'ANALISTA', 'CAJERO', 'ADMIN'];

const MATRIZ: [método: 'get' | 'post', ruta: string, permitidos: Rol[]][] = [
  ['get', '/auth/me', TODOS],
  ['post', '/auth/logout', TODOS],
  ['get', '/tipos-empleo', TODOS],
  ['get', '/bancos', TODOS],
  ['post', '/solicitudes', ['OFICIAL', 'ADMIN']],
  ['get', '/solicitudes', TODOS],
  ['get', '/solicitudes/999999', TODOS],
  ['post', '/solicitudes/999999/aprobar', ['ANALISTA', 'ADMIN']],
  ['post', '/solicitudes/999999/rechazar', ['ANALISTA', 'ADMIN']],
  ['get', '/creditos', TODOS],
  ['get', '/creditos/999999', TODOS],
  ['get', '/creditos/999999/plan-pagos', TODOS],
  ['post', '/desembolsos', ['CAJERO', 'ADMIN']],
];

describe('matriz de roles', () => {
  let app: AppPrueba;
  const tokens = {} as Record<Rol, string>;

  beforeAll(async () => {
    app = await crearAppPrueba();
    for (const rol of TODOS) tokens[rol] = (await iniciarSesion(app, rol.toLowerCase())).accessToken;
  });
  afterAll(async () => {
    await app.cerrar();
  });

  describe.each(MATRIZ)('%s %s', (metodo, ruta, permitidos) => {
    it.each(TODOS)('%s', async (rol) => {
      const r = await app.agente()[metodo](`/api/v1${ruta}`).set('Authorization', `Bearer ${tokens[rol]}`).send({});
      if (permitidos.includes(rol)) {
        expect([401, 403]).not.toContain(r.status);
      } else {
        expect(r.status).toBe(403);
        expect(r.body.code).toBe('PROHIBIDO');
      }
    });

    it('sin token responde 401', async () => {
      await app.agente()[metodo](`/api/v1${ruta}`).send({}).expect(401);
    });
  });

  it('health y login son públicos', async () => {
    await app.agente().get('/api/v1/health').expect(200);
    await app.agente().post('/api/v1/auth/login').send({ username: 'x', password: 'y' }).expect(401);
  });
});
