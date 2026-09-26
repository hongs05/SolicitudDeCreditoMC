import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type AppPrueba, crearAppPrueba } from './helpers/app';
import { crearCreditoAprobado } from './helpers/datos';
import { iniciarSesion } from './helpers/sesiones';

describe('desembolsos', () => {
  let app: AppPrueba;
  let cajero: string;
  let bancoId: number;

  const desembolsar = (cuerpo: object) =>
    app.agente().post('/api/v1/desembolsos').set('Authorization', `Bearer ${cajero}`).send(cuerpo);

  beforeAll(async () => {
    app = await crearAppPrueba();
    ({ accessToken: cajero } = await iniciarSesion(app, 'cajero'));
    const bancos = await app.agente().get('/api/v1/bancos').set('Authorization', `Bearer ${cajero}`).expect(200);
    expect(bancos.body.map((b: { nombre: string }) => b.nombre)).toEqual(['LAFISE', 'FICOHSA', 'BAC Credomatic', 'Banpro']);
    bancoId = bancos.body[2].id;
  });
  afterAll(async () => {
    await app.cerrar();
  });

  it('desembolsa un crédito aprobado', async () => {
    const { creditoId } = await crearCreditoAprobado(app.db.prisma);
    const r = await desembolsar({ creditoId, bancoId, numeroCuenta: '1002003004' }).expect(201);
    expect(r.body).toMatchObject({
      creditoId,
      banco: { codigo: 'BAC_CREDOMATIC', nombre: 'BAC Credomatic' },
      numeroCuenta: '1002003004',
      ejecutadoPor: { username: 'cajero', rol: 'CAJERO' },
    });
    const credito = await app.agente().get(`/api/v1/creditos/${creditoId}`).set('Authorization', `Bearer ${cajero}`);
    expect(credito.body.estado).toBe('DESEMBOLSADA');
  });

  it('no desembolsa dos veces', async () => {
    const { creditoId } = await crearCreditoAprobado(app.db.prisma);
    await desembolsar({ creditoId, bancoId, numeroCuenta: '1002003004' }).expect(201);
    const r = await desembolsar({ creditoId, bancoId, numeroCuenta: '1002003004' }).expect(409);
    expect(r.body).toMatchObject({ code: 'CREDITO_YA_DESEMBOLSADO', message: 'El crédito ya fue desembolsado' });
  });

  it('defensa en profundidad: rechaza un crédito cuya solicitud no está aprobada', async () => {
    const { creditoId, solicitudId } = await crearCreditoAprobado(app.db.prisma);
    await app.db.prisma.solicitud.update({ where: { id: solicitudId }, data: { estado: 'PENDIENTE' } });
    const r = await desembolsar({ creditoId, bancoId, numeroCuenta: '1002003004' }).expect(422);
    expect(r.body).toMatchObject({ code: 'CREDITO_NO_APROBADO', message: 'Solo se desembolsan créditos aprobados' });
    expect(await app.db.prisma.desembolso.count({ where: { creditoId } })).toBe(0);
  });

  it('un crédito inexistente da 404', async () => {
    const r = await desembolsar({ creditoId: 999999, bancoId, numeroCuenta: '1002003004' }).expect(404);
    expect(r.body.message).toBe('No se encontró el crédito');
  });

  it('valida cuenta y banco', async () => {
    const { creditoId } = await crearCreditoAprobado(app.db.prisma);
    const cuenta = await desembolsar({ creditoId, bancoId, numeroCuenta: '12-34' }).expect(400);
    expect(cuenta.body.details[0]).toMatchObject({ field: 'numeroCuenta', code: 'FORMATO_INVALIDO' });
    const banco = await desembolsar({ creditoId, bancoId: 999, numeroCuenta: '1002003004' }).expect(404);
    expect(banco.body.message).toBe('No se encontró el banco');
  });
});
