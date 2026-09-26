import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type AppPrueba, crearAppPrueba } from './helpers/app';
import { crearCreditoAprobado } from './helpers/datos';
import { iniciarSesion } from './helpers/sesiones';

describe('créditos', () => {
  let app: AppPrueba;
  let token: string;
  let creditoId: number;
  const get = (ruta: string) => app.agente().get(ruta).set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    app = await crearAppPrueba();
    ({ creditoId } = await crearCreditoAprobado(app.db.prisma, { cedula: 'CED-1' }));
    await crearCreditoAprobado(app.db.prisma, { cedula: 'CED-2' });
    ({ accessToken: token } = await iniciarSesion(app, 'cajero'));
  });
  afterAll(async () => {
    await app.cerrar();
  });

  it('lista con paginación y orden descendente', async () => {
    const r = await get('/api/v1/creditos?pageSize=1').expect(200);
    expect(r.body).toMatchObject({ total: 2, page: 1, pageSize: 1 });
    expect(r.body.items[0]).toMatchObject({ numero: 'CR-000002', cedula: 'CED-2', monto: '10000.00', plazo: 12, estado: 'APROBADA' });
  });

  it('filtra por cédula, número y estado', async () => {
    expect((await get('/api/v1/creditos?cedula=CED-1').expect(200)).body.total).toBe(1);
    expect((await get('/api/v1/creditos?numero=CR-000002').expect(200)).body.items[0].cedula).toBe('CED-2');
    expect((await get('/api/v1/creditos?estado=APROBADA').expect(200)).body.total).toBe(2);
    expect((await get('/api/v1/creditos?estado=DESEMBOLSADA').expect(200)).body.total).toBe(0);
  });

  it('obtiene el detalle con montos como texto', async () => {
    const r = await get(`/api/v1/creditos/${creditoId}`).expect(200);
    expect(r.body).toMatchObject({
      numero: 'CR-000001', tasaAnual: '12.00', cuotaNivelada: '888.49',
      fechaBase: '2026-09-24', desembolso: null, periodicidad: 'MENSUAL',
    });
  });

  it('devuelve el plan de pagos', async () => {
    const r = await get(`/api/v1/creditos/${creditoId}/plan-pagos`).expect(200);
    expect(r.body.credito.numero).toBe('CR-000001');
    expect(r.body.cuotas).toHaveLength(12);
    expect(r.body.cuotas[0]).toEqual({
      numero: 1, fechaVencimiento: '2026-10-24', capital: '788.49',
      interes: '100.00', valorCuota: '888.49', saldoRestante: '9211.51',
    });
    expect(r.body.cuotas[11]).toMatchObject({ valorCuota: '888.47', saldoRestante: '0.00' });
  });

  it('responde 404, 400 y valida filtros', async () => {
    expect((await get('/api/v1/creditos/999999').expect(404)).body.message).toBe('No se encontró el crédito');
    await get('/api/v1/creditos/abc').expect(400);
    const estado = await get('/api/v1/creditos?estado=INVENTADO').expect(400);
    expect(estado.body.details[0]).toMatchObject({ field: 'estado', code: 'VALOR_NO_PERMITIDO' });
    await get('/api/v1/creditos?pageSize=101').expect(400);
  });

  it('exige autenticación', async () => {
    await app.agente().get('/api/v1/creditos').expect(401);
  });
});
