import { type CuotaPlan, TransicionInvalidaError } from '@credito/domain';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '../src/auth/infrastructure/bcrypt-password-hasher';
import { PrismaCreditoRepository } from '../src/creditos/infrastructure/prisma-credito.repository';
import type { RepositoriosTx } from '../src/shared/application/ports/unit-of-work';
import { aNumero, type ClientePrisma } from '../src/shared/infrastructure/prisma/decimal';
import { PrismaUnitOfWork } from '../src/shared/infrastructure/prisma/prisma-unit-of-work';
import { crearRepositorios } from '../src/shared/infrastructure/prisma/repositorios';
import { sembrar } from '../src/shared/infrastructure/prisma/semilla';
import { AprobarSolicitud } from '../src/solicitudes/application/aprobar-solicitud.use-case';
import { CrearSolicitud } from '../src/solicitudes/application/crear-solicitud.use-case';
import { RelojFijo } from '../src/testing/en-memoria';
import { type BaseDatosPrueba, crearBaseDatosPrueba } from './helpers/base-datos';
import { datosSolicitud, idUsuario } from './helpers/datos';

class CreditosQueFallanAMitad extends PrismaCreditoRepository {
  protected override async insertarCuotas(creditoId: number, cuotas: CuotaPlan[]): Promise<void> {
    await super.insertarCuotas(creditoId, cuotas.slice(0, Math.floor(cuotas.length / 2)));
    throw new Error('Fallo simulado al insertar cuotas');
  }
}

class UnitOfWorkQueFalla extends PrismaUnitOfWork {
  protected override crearRepositorios(tx: ClientePrisma): RepositoriosTx {
    return { ...crearRepositorios(tx), creditos: new CreditosQueFallanAMitad(tx) };
  }
}

describe('aprobación contra SQLite real', () => {
  let db: BaseDatosPrueba;
  let uow: PrismaUnitOfWork;
  const reloj = new RelojFijo();
  let oficialId: number;
  let analistaId: number;

  const crear = () => new CrearSolicitud(uow, reloj).ejecutar(datosSolicitud(), oficialId);
  const aprobar = (solicitudId: number, conUow: PrismaUnitOfWork = uow) =>
    new AprobarSolicitud(conUow, reloj).ejecutar({ solicitudId, observaciones: 'ok', usuarioId: analistaId });

  beforeEach(async () => {
    db = await crearBaseDatosPrueba();
    await sembrar(db.prisma, new BcryptPasswordHasher(4));
    uow = new PrismaUnitOfWork(db.prisma);
    oficialId = await idUsuario(db.prisma, 'oficial');
    analistaId = await idUsuario(db.prisma, 'analista');
  });
  afterEach(async () => {
    await db.cerrar();
  });

  it('atomicidad: si fallan las cuotas a mitad, no queda nada', async () => {
    const solicitudId = await crear();

    await expect(aprobar(solicitudId, new UnitOfWorkQueFalla(db.prisma))).rejects.toThrow('Fallo simulado');

    const solicitud = await db.prisma.solicitud.findUniqueOrThrow({ where: { id: solicitudId } });
    expect(solicitud.estado).toBe('PENDIENTE');
    expect(solicitud.observaciones).toBeNull();
    expect(await db.prisma.credito.count()).toBe(0);
    expect(await db.prisma.cuota.count()).toBe(0);
  });

  it('concurrencia: dos aprobaciones simultáneas producen un solo crédito', async () => {
    const solicitudId = await crear();

    const resultados = await Promise.allSettled([aprobar(solicitudId), aprobar(solicitudId)]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rechazo = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rechazo.reason).toBeInstanceOf(TransicionInvalidaError);
    expect(await db.prisma.credito.count()).toBe(1);
    expect(await db.prisma.cuota.count()).toBe(12);
  });

  it('secuencia: los créditos se numeran de forma consecutiva', async () => {
    for (let i = 0; i < 3; i++) await aprobar(await crear());
    const numeros = (await db.prisma.credito.findMany({ orderBy: { secuencia: 'asc' } })).map((c) => c.numero);
    expect(numeros).toEqual(['CR-000001', 'CR-000002', 'CR-000003']);
  });

  it('decimales: el plan leído coincide al centavo con el calculado', async () => {
    const { creditoId } = await aprobar(await crear());
    const credito = await uow.run((r) => r.creditos.obtenerPorId(creditoId));
    const filas = await db.prisma.cuota.findMany({ where: { creditoId }, orderBy: { numero: 'asc' } });
    expect(filas.map((f) => ({
      numero: f.numero,
      fechaVencimiento: f.fechaVencimiento,
      capital: aNumero(f.capital),
      interes: aNumero(f.interes),
      valorCuota: aNumero(f.valorCuota),
      saldoRestante: aNumero(f.saldoRestante),
    }))).toEqual(credito!.generarPlan());
  });
});
