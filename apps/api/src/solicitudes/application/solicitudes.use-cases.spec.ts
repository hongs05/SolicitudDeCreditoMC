import {
  EdadMaximaExcedidaError, EstadoSolicitud, NoEncontradoError, Periodicidad, TransicionInvalidaError,
} from '@credito/domain';
import { describe, expect, it } from 'vitest';
import { RelojFijo, UnitOfWorkEnMemoria } from '../../testing/en-memoria';
import { AprobarSolicitud } from './aprobar-solicitud.use-case';
import { CrearSolicitud } from './crear-solicitud.use-case';
import { RechazarSolicitud } from './rechazar-solicitud.use-case';

const datos = (cambios = {}) => ({
  nombreCompleto: 'Ana López', cedula: '0010101900001A', correo: 'ana@example.com', telefono: '88887777',
  fechaNacimiento: '1990-01-01', tipoEmpleoId: 1, empresa: 'Empresa S.A.', antiguedadAnios: 5,
  ingresoMensual: 30000, montoSolicitado: 10000, cantidadCuotas: 12, tasaAnual: 12,
  periodicidad: Periodicidad.MENSUAL, ...cambios,
});

const preparar = () => {
  const uow = new UnitOfWorkEnMemoria();
  const reloj = new RelojFijo();
  return {
    uow,
    crear: new CrearSolicitud(uow, reloj),
    aprobar: new AprobarSolicitud(uow, reloj),
    rechazar: new RechazarSolicitud(uow, reloj),
  };
};

describe('CrearSolicitud', () => {
  it('persiste en PENDIENTE y devuelve el id', async () => {
    const p = preparar();
    const id = await p.crear.ejecutar(datos(), 7);
    expect(p.uow.repos.solicitudes.filas.get(id)).toMatchObject({ estado: EstadoSolicitud.PENDIENTE, creadaPorId: 7 });
  });

  it('rechaza mayores de 80 sin persistir', async () => {
    const p = preparar();
    await expect(p.crear.ejecutar(datos({ fechaNacimiento: '1945-09-24' }), 7)).rejects.toBeInstanceOf(EdadMaximaExcedidaError);
    expect(p.uow.repos.solicitudes.filas.size).toBe(0);
  });

  it('rechaza un tipo de empleo inexistente', async () => {
    const p = preparar();
    await expect(p.crear.ejecutar(datos({ tipoEmpleoId: 99 }), 7)).rejects.toMatchObject({
      code: 'NO_ENCONTRADO', params: { recurso: 'TipoEmpleo' },
    });
  });
});

describe('AprobarSolicitud', () => {
  it('crea el crédito CR-000001 con el plan completo y fecha base de hoy', async () => {
    const p = preparar();
    const id = await p.crear.ejecutar(datos(), 7);
    const { creditoId } = await p.aprobar.ejecutar({ solicitudId: id, observaciones: 'ok', usuarioId: 9 });

    expect(p.uow.repos.solicitudes.filas.get(id)!.estado).toBe(EstadoSolicitud.APROBADA);
    expect(p.uow.repos.creditos.creditos.get(creditoId)).toMatchObject({
      numero: 'CR-000001', solicitudId: id, cuotaNivelada: 888.49, fechaBase: '2026-09-24',
    });
    const cuotas = p.uow.repos.creditos.cuotas.get(creditoId)!;
    expect(cuotas).toHaveLength(12);
    expect(cuotas[0]).toMatchObject({ fechaVencimiento: '2026-10-24', capital: 788.49 });
  });

  it('numera los créditos en secuencia', async () => {
    const p = preparar();
    const a = await p.crear.ejecutar(datos(), 7);
    const b = await p.crear.ejecutar(datos(), 7);
    await p.aprobar.ejecutar({ solicitudId: a, observaciones: 'ok', usuarioId: 9 });
    const { creditoId } = await p.aprobar.ejecutar({ solicitudId: b, observaciones: 'ok', usuarioId: 9 });
    expect(p.uow.repos.creditos.creditos.get(creditoId)!.numero).toBe('CR-000002');
  });

  it('una solicitud inexistente da NO_ENCONTRADO', async () => {
    await expect(preparar().aprobar.ejecutar({ solicitudId: 99, observaciones: 'ok', usuarioId: 9 }))
      .rejects.toBeInstanceOf(NoEncontradoError);
  });

  it('no aprueba dos veces', async () => {
    const p = preparar();
    const id = await p.crear.ejecutar(datos(), 7);
    await p.aprobar.ejecutar({ solicitudId: id, observaciones: 'ok', usuarioId: 9 });
    await expect(p.aprobar.ejecutar({ solicitudId: id, observaciones: 'ok', usuarioId: 9 }))
      .rejects.toBeInstanceOf(TransicionInvalidaError);
  });
});

describe('RechazarSolicitud', () => {
  it('pasa a RECHAZADA sin crear crédito', async () => {
    const p = preparar();
    const id = await p.crear.ejecutar(datos(), 7);
    await p.rechazar.ejecutar({ solicitudId: id, observaciones: 'Ingresos insuficientes', usuarioId: 9 });
    expect(p.uow.repos.solicitudes.filas.get(id)).toMatchObject({
      estado: EstadoSolicitud.RECHAZADA, observaciones: 'Ingresos insuficientes',
    });
    expect(p.uow.repos.creditos.creditos.size).toBe(0);
  });
});
