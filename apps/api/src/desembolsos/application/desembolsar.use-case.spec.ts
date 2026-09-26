import {
  CreditoNoAprobadoError, CreditoYaDesembolsadoError, EstadoSolicitud, NoEncontradoError, Periodicidad,
} from '@credito/domain';
import { describe, expect, it } from 'vitest';
import { AprobarSolicitud } from '../../solicitudes/application/aprobar-solicitud.use-case';
import { CrearSolicitud } from '../../solicitudes/application/crear-solicitud.use-case';
import { RelojFijo, UnitOfWorkEnMemoria } from '../../testing/en-memoria';
import { Desembolsar } from './desembolsar.use-case';

const datos = {
  nombreCompleto: 'Ana López', cedula: 'X1', correo: 'a@b.com', telefono: '88887777',
  fechaNacimiento: '1990-01-01', tipoEmpleoId: 1, empresa: 'E', antiguedadAnios: 1,
  ingresoMensual: 1000, montoSolicitado: 1000, cantidadCuotas: 3, tasaAnual: 0,
  periodicidad: Periodicidad.MENSUAL,
};

const preparar = async () => {
  const uow = new UnitOfWorkEnMemoria();
  const reloj = new RelojFijo();
  const solicitudId = await new CrearSolicitud(uow, reloj).ejecutar(datos, 1);
  const { creditoId } = await new AprobarSolicitud(uow, reloj).ejecutar({ solicitudId, observaciones: 'ok', usuarioId: 2 });
  return { uow, solicitudId, creditoId, desembolsar: new Desembolsar(uow, reloj) };
};

describe('Desembolsar', () => {
  it('pasa a DESEMBOLSADA y registra el desembolso', async () => {
    const p = await preparar();
    await p.desembolsar.ejecutar({ creditoId: p.creditoId, bancoId: 1, numeroCuenta: '123456', usuarioId: 3 });
    expect(p.uow.repos.solicitudes.filas.get(p.solicitudId)!.estado).toBe(EstadoSolicitud.DESEMBOLSADA);
    expect(p.uow.repos.desembolsos.filas[0]).toMatchObject({
      creditoId: p.creditoId, bancoId: 1, numeroCuenta: '123456', ejecutadoPorId: 3,
      ejecutadoEn: new Date('2026-09-24T15:00:00Z'),
    });
  });

  it('no desembolsa dos veces', async () => {
    const p = await preparar();
    const comando = { creditoId: p.creditoId, bancoId: 1, numeroCuenta: '123456', usuarioId: 3 };
    await p.desembolsar.ejecutar(comando);
    await expect(p.desembolsar.ejecutar(comando)).rejects.toBeInstanceOf(CreditoYaDesembolsadoError);
  });

  it('rechaza un crédito cuya solicitud no está aprobada', async () => {
    const p = await preparar();
    const fila = p.uow.repos.solicitudes.filas.get(p.solicitudId)!;
    p.uow.repos.solicitudes.filas.set(p.solicitudId, { ...fila, estado: EstadoSolicitud.PENDIENTE });
    await expect(p.desembolsar.ejecutar({ creditoId: p.creditoId, bancoId: 1, numeroCuenta: '123456', usuarioId: 3 }))
      .rejects.toBeInstanceOf(CreditoNoAprobadoError);
  });

  it.each([
    [{ creditoId: 999 }, 'Credito'],
    [{ bancoId: 999 }, 'Banco'],
    [{ bancoId: 5 }, 'Banco'],
  ])('%o da NO_ENCONTRADO de %s', async (cambio, recurso) => {
    const p = await preparar();
    await expect(p.desembolsar.ejecutar({ creditoId: p.creditoId, bancoId: 1, numeroCuenta: '123456', usuarioId: 3, ...cambio }))
      .rejects.toMatchObject({ code: 'NO_ENCONTRADO', params: { recurso } });
  });

  it('no deja rastro si falla', async () => {
    const p = await preparar();
    await expect(p.desembolsar.ejecutar({ creditoId: p.creditoId, bancoId: 999, numeroCuenta: '1', usuarioId: 3 }))
      .rejects.toBeInstanceOf(NoEncontradoError);
    expect(p.uow.repos.desembolsos.filas).toHaveLength(0);
  });
});
