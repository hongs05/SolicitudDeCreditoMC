import { Credito, EstadoSolicitud, Solicitud } from '@credito/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '../src/auth/infrastructure/bcrypt-password-hasher';
import { RefreshToken } from '../src/auth/domain/refresh-token';
import { aNumero } from '../src/shared/infrastructure/prisma/decimal';
import { PrismaUnitOfWork } from '../src/shared/infrastructure/prisma/prisma-unit-of-work';
import { sembrar } from '../src/shared/infrastructure/prisma/semilla';
import { type BaseDatosPrueba, crearBaseDatosPrueba } from './helpers/base-datos';
import { AHORA_PRUEBA, datosSolicitud, idUsuario } from './helpers/datos';

describe('repositorios Prisma', () => {
  let db: BaseDatosPrueba;
  let uow: PrismaUnitOfWork;
  let oficialId: number;
  let analistaId: number;

  const crearSolicitud = (cambios = {}) =>
    uow.run((r) => r.solicitudes.crear(Solicitud.crear(datosSolicitud(cambios), oficialId, '2026-09-24', AHORA_PRUEBA)));

  beforeAll(async () => {
    db = await crearBaseDatosPrueba();
    await sembrar(db.prisma, new BcryptPasswordHasher(4));
    uow = new PrismaUnitOfWork(db.prisma);
    oficialId = await idUsuario(db.prisma, 'oficial');
    analistaId = await idUsuario(db.prisma, 'analista');
  });
  afterAll(async () => {
    await db.cerrar();
  });

  it('guarda y recupera una solicitud con decimales exactos', async () => {
    const creada = await crearSolicitud({ montoSolicitado: 12345.67, tasaAnual: 18.5, ingresoMensual: 999.99 });
    const leida = await uow.run((r) => r.solicitudes.obtenerPorId(creada.id!));
    expect(leida!.snapshot()).toEqual(creada.snapshot());
    expect(leida!.snapshot()).toMatchObject({ montoSolicitado: 12345.67, tasaAnual: 18.5, ingresoMensual: 999.99 });
  });

  it('persiste el dictamen', async () => {
    const solicitud = await crearSolicitud();
    solicitud.aprobar('Buen perfil', analistaId, AHORA_PRUEBA);
    await uow.run((r) => r.solicitudes.guardar(solicitud));
    const leida = await uow.run((r) => r.solicitudes.obtenerPorId(solicitud.id!));
    expect(leida!.snapshot()).toMatchObject({
      estado: EstadoSolicitud.APROBADA,
      observaciones: 'Buen perfil',
      dictaminadaPorId: analistaId,
      dictaminadaEn: AHORA_PRUEBA,
    });
  });

  it('crea el crédito con cuotas exactas y secuencia incremental', async () => {
    const solicitud = await crearSolicitud();
    solicitud.aprobar('ok', analistaId, AHORA_PRUEBA);
    const secuencia = await uow.run((r) => r.creditos.siguienteSecuencia());
    const credito = Credito.desde(solicitud, secuencia, '2026-01-31');
    const plan = credito.generarPlan();
    const creado = await uow.run(async (r) => {
      await r.solicitudes.guardar(solicitud);
      return r.creditos.crear(credito, plan);
    });

    const filas = await db.prisma.cuota.findMany({ where: { creditoId: creado.id! }, orderBy: { numero: 'asc' } });
    expect(filas.map((f) => ({
      numero: f.numero,
      fechaVencimiento: f.fechaVencimiento,
      capital: aNumero(f.capital),
      interes: aNumero(f.interes),
      valorCuota: aNumero(f.valorCuota),
      saldoRestante: aNumero(f.saldoRestante),
    }))).toEqual(plan);
    expect((await uow.run((r) => r.creditos.obtenerPorId(creado.id!)))!.snapshot()).toEqual(creado.snapshot());
    expect(await uow.run((r) => r.creditos.siguienteSecuencia())).toBe(secuencia + 1);
  });

  it('busca refresh tokens por hash, los rota y revoca la familia', async () => {
    const primero = await uow.run((r) => r.refreshTokens.crear(
      RefreshToken.emitir({ usuarioId: oficialId, familiaId: 'fam-a', tokenHash: 'h-a1', ahora: AHORA_PRUEBA, ttlDias: 7 }),
    ));
    const segundo = await uow.run((r) => r.refreshTokens.crear(
      RefreshToken.emitir({ usuarioId: oficialId, familiaId: 'fam-a', tokenHash: 'h-a2', ahora: AHORA_PRUEBA, ttlDias: 7 }),
    ));
    primero.rotar(segundo.id!, AHORA_PRUEBA);
    await uow.run((r) => r.refreshTokens.guardar(primero));
    expect((await uow.run((r) => r.refreshTokens.buscarPorHash('h-a1')))!.snapshot().reemplazadoPorId).toBe(segundo.id);

    await uow.run((r) => r.refreshTokens.revocarFamilia('fam-a', AHORA_PRUEBA));
    expect((await uow.run((r) => r.refreshTokens.buscarPorHash('h-a2')))!.estaRevocado()).toBe(true);
    expect(await uow.run((r) => r.refreshTokens.buscarPorHash('no-existe'))).toBeNull();
  });

  it('lee catálogos', async () => {
    const tipos = await uow.run((r) => r.catalogos.listarTiposEmpleo());
    expect(tipos.map((t) => t.codigo)).toEqual(['ASALARIADO', 'INDEPENDIENTE']);
    expect(await uow.run((r) => r.catalogos.existeTipoEmpleo(99))).toBe(false);
    const bancos = await uow.run((r) => r.catalogos.listarBancos());
    expect(bancos).toHaveLength(4);
    expect(await uow.run((r) => r.catalogos.bancoActivo(bancos[0]!.id))).toBe(true);
  });

  it('revierte toda la transacción si la función lanza', async () => {
    const antes = await db.prisma.solicitud.count();
    await expect(uow.run(async (r) => {
      await r.solicitudes.crear(Solicitud.crear(datosSolicitud(), oficialId, '2026-09-24', AHORA_PRUEBA));
      throw new Error('falla simulada');
    })).rejects.toThrow('falla simulada');
    expect(await db.prisma.solicitud.count()).toBe(antes);
  });

  it('serializa las transacciones concurrentes y sigue funcionando tras un error', async () => {
    const eventos: string[] = [];
    await Promise.allSettled([
      uow.run(async () => {
        eventos.push('a-inicio');
        await new Promise((resolver) => setTimeout(resolver, 50));
        eventos.push('a-fin');
        throw new Error('a falla');
      }),
      uow.run(async () => {
        eventos.push('b-inicio');
        eventos.push('b-fin');
      }),
    ]);
    expect(eventos).toEqual(['a-inicio', 'a-fin', 'b-inicio', 'b-fin']);
  });
});
