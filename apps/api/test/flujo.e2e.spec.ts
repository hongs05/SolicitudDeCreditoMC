import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type AppPrueba, crearAppPrueba } from './helpers/app';
import { cuerpoSolicitud } from './helpers/cuerpos';
import { iniciarSesion } from './helpers/sesiones';

describe('flujo completo', () => {
  let app: AppPrueba;

  beforeAll(async () => {
    app = await crearAppPrueba();
  });
  afterAll(async () => {
    await app.cerrar();
  });

  it('oficial crea, analista aprueba, cajero desembolsa y cualquiera consulta por cédula', async () => {
    const auth = async (u: string) => `Bearer ${(await iniciarSesion(app, u)).accessToken}`;
    const [oficial, analista, cajero] = [await auth('oficial'), await auth('analista'), await auth('cajero')];

    const creada = await app.agente().post('/api/v1/solicitudes').set('Authorization', oficial)
      .send(cuerpoSolicitud({ cedula: 'FLUJO-001' })).expect(201);

    const bandeja = await app.agente().get('/api/v1/solicitudes?estado=PENDIENTE').set('Authorization', analista).expect(200);
    expect(bandeja.body.items.map((s: { id: number }) => s.id)).toContain(creada.body.id);

    const dictamen = await app.agente().post(`/api/v1/solicitudes/${creada.body.id}/aprobar`)
      .set('Authorization', analista).send({ observaciones: 'Cumple políticas' }).expect(200);
    const creditoId = dictamen.body.credito.id as number;

    const aprobadas = await app.agente().get('/api/v1/creditos?estado=APROBADA').set('Authorization', cajero).expect(200);
    expect(aprobadas.body.items.map((c: { id: number }) => c.id)).toContain(creditoId);

    const bancos = await app.agente().get('/api/v1/bancos').set('Authorization', cajero).expect(200);
    await app.agente().post('/api/v1/desembolsos').set('Authorization', cajero)
      .send({ creditoId, bancoId: bancos.body[0].id, numeroCuenta: '000111222' }).expect(201);

    const porCedula = await app.agente().get('/api/v1/creditos?cedula=FLUJO-001').set('Authorization', oficial).expect(200);
    expect(porCedula.body.items[0]).toMatchObject({ id: creditoId, estado: 'DESEMBOLSADA' });

    const plan = await app.agente().get(`/api/v1/creditos/${creditoId}/plan-pagos`).set('Authorization', oficial).expect(200);
    expect(plan.body.cuotas).toHaveLength(12);
  });

  it('publica la documentación OpenAPI', async () => {
    const r = await app.agente().get('/api/docs-json').expect(200);
    expect(Object.keys(r.body.paths)).toEqual(expect.arrayContaining([
      '/api/v1/solicitudes', '/api/v1/creditos/{id}/plan-pagos', '/api/v1/desembolsos', '/api/v1/auth/login',
    ]));
    expect(r.body.security).toEqual([{ bearer: [] }]);
  });
});
