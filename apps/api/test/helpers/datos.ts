import { type DatosSolicitud, Periodicidad } from '@credito/domain';
import type { PrismaClient } from '@prisma/client';
import { PrismaUnitOfWork } from '../../src/shared/infrastructure/prisma/prisma-unit-of-work';
import { AprobarSolicitud } from '../../src/solicitudes/application/aprobar-solicitud.use-case';
import { CrearSolicitud } from '../../src/solicitudes/application/crear-solicitud.use-case';
import { RelojFijo } from '../../src/testing/en-memoria';

export const AHORA_PRUEBA = new Date('2026-09-24T15:00:00Z');

export const datosSolicitud = (cambios: Partial<DatosSolicitud> = {}): DatosSolicitud => ({
  nombreCompleto: 'Ana López',
  cedula: '0010101900001A',
  correo: 'ana@example.com',
  telefono: '88887777',
  fechaNacimiento: '1990-01-01',
  tipoEmpleoId: 1,
  empresa: 'Empresa S.A.',
  antiguedadAnios: 5,
  ingresoMensual: 30000,
  montoSolicitado: 10000,
  cantidadCuotas: 12,
  tasaAnual: 12,
  periodicidad: Periodicidad.MENSUAL,
  ...cambios,
});

export async function idUsuario(prisma: PrismaClient, username: string): Promise<number> {
  return (await prisma.usuario.findUniqueOrThrow({ where: { username } })).id;
}

export async function crearCreditoAprobado(
  prisma: PrismaClient,
  cambios: Partial<DatosSolicitud> = {},
): Promise<{ solicitudId: number; creditoId: number }> {
  const uow = new PrismaUnitOfWork(prisma);
  const reloj = new RelojFijo();
  const solicitudId = await new CrearSolicitud(uow, reloj).ejecutar(datosSolicitud(cambios), await idUsuario(prisma, 'oficial'));
  const { creditoId } = await new AprobarSolicitud(uow, reloj).ejecutar({
    solicitudId,
    observaciones: 'Aprobado en prueba',
    usuarioId: await idUsuario(prisma, 'analista'),
  });
  return { solicitudId, creditoId };
}
