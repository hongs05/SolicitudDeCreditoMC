import { type CuotaPlan, esEstadoSolicitud, esPeriodicidad, esRol } from '@credito/domain';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { Paginado } from '../../shared/application/vistas';
import { aNumero } from '../../shared/infrastructure/prisma/decimal';
import type { CreditoConsultas, CreditoVista, FiltrosCreditos } from '../application/ports/credito.consultas';

const INCLUIR = {
  solicitud: { select: { cedula: true, nombreCompleto: true, estado: true } },
  desembolso: { include: { banco: true, ejecutadoPor: true } },
} satisfies Prisma.CreditoInclude;

type CreditoConRelaciones = Prisma.CreditoGetPayload<{ include: typeof INCLUIR }>;

function aVista(f: CreditoConRelaciones): CreditoVista {
  const { estado } = f.solicitud;
  if (!esEstadoSolicitud(estado) || !esPeriodicidad(f.periodicidad)) {
    throw new Error(`Crédito ${f.id} con datos inválidos`);
  }
  const d = f.desembolso;
  if (d && !esRol(d.ejecutadoPor.rol)) throw new Error(`Usuario ${d.ejecutadoPor.id} con rol inválido`);
  return {
    id: f.id,
    numero: f.numero,
    solicitudId: f.solicitudId,
    cedula: f.solicitud.cedula,
    nombreCompleto: f.solicitud.nombreCompleto,
    monto: aNumero(f.monto),
    tasaAnual: aNumero(f.tasaAnual),
    periodicidad: f.periodicidad,
    plazo: f.plazo,
    cuotaNivelada: aNumero(f.cuotaNivelada),
    fechaBase: f.fechaBase,
    estado,
    creadoEn: f.creadoEn,
    desembolso: d
      ? {
          id: d.id,
          creditoId: d.creditoId,
          banco: { id: d.banco.id, codigo: d.banco.codigo, nombre: d.banco.nombre },
          numeroCuenta: d.numeroCuenta,
          ejecutadoPor: { id: d.ejecutadoPor.id, username: d.ejecutadoPor.username, rol: d.ejecutadoPor.rol as never },
          ejecutadoEn: d.ejecutadoEn,
        }
      : null,
  };
}

export class PrismaCreditoConsultas implements CreditoConsultas {
  constructor(private readonly prisma: PrismaClient) {}

  async listar(f: FiltrosCreditos): Promise<Paginado<CreditoVista>> {
    const where: Prisma.CreditoWhereInput = {
      numero: f.numero,
      solicitud: { estado: f.estado, cedula: f.cedula },
    };
    const [total, filas] = await this.prisma.$transaction([
      this.prisma.credito.count({ where }),
      this.prisma.credito.findMany({
        where,
        include: INCLUIR,
        orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
        skip: (f.page - 1) * f.pageSize,
        take: f.pageSize,
      }),
    ]);
    return { items: filas.map(aVista), total, page: f.page, pageSize: f.pageSize };
  }

  async obtener(id: number): Promise<CreditoVista | null> {
    const fila = await this.prisma.credito.findUnique({ where: { id }, include: INCLUIR });
    return fila ? aVista(fila) : null;
  }

  async cuotas(creditoId: number): Promise<CuotaPlan[]> {
    const filas = await this.prisma.cuota.findMany({ where: { creditoId }, orderBy: { numero: 'asc' } });
    return filas.map((c) => ({
      numero: c.numero,
      fechaVencimiento: c.fechaVencimiento,
      capital: aNumero(c.capital),
      interes: aNumero(c.interes),
      valorCuota: aNumero(c.valorCuota),
      saldoRestante: aNumero(c.saldoRestante),
    }));
  }
}
