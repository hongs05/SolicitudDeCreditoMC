import { esEstadoSolicitud, esPeriodicidad, esRol, type Rol } from '@credito/domain';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { Paginado } from '../../shared/application/vistas';
import { aNumero } from '../../shared/infrastructure/prisma/decimal';
import type { FiltrosSolicitudes, SolicitudConsultas, SolicitudVista } from '../application/ports/solicitud.consultas';

const INCLUIR = {
  tipoEmpleo: true,
  dictaminadaPor: true,
  credito: { select: { id: true } },
} satisfies Prisma.SolicitudInclude;

type SolicitudConRelaciones = Prisma.SolicitudGetPayload<{ include: typeof INCLUIR }>;

function comoRol(rol: string, usuarioId: number): Rol {
  if (!esRol(rol)) throw new Error(`Usuario ${usuarioId} con rol inválido`);
  return rol;
}

function aVista(f: SolicitudConRelaciones): SolicitudVista {
  if (!esEstadoSolicitud(f.estado) || !esPeriodicidad(f.periodicidad)) {
    throw new Error(`Solicitud ${f.id} con datos inválidos`);
  }
  const d = f.dictaminadaPor;
  return {
    id: f.id,
    estado: f.estado,
    nombreCompleto: f.nombreCompleto,
    cedula: f.cedula,
    correo: f.correo,
    telefono: f.telefono,
    fechaNacimiento: f.fechaNacimiento,
    tipoEmpleo: { id: f.tipoEmpleo.id, codigo: f.tipoEmpleo.codigo, nombre: f.tipoEmpleo.nombre },
    empresa: f.empresa,
    antiguedadAnios: f.antiguedadAnios,
    ingresoMensual: aNumero(f.ingresoMensual),
    montoSolicitado: aNumero(f.montoSolicitado),
    cantidadCuotas: f.cantidadCuotas,
    tasaAnual: aNumero(f.tasaAnual),
    periodicidad: f.periodicidad,
    observaciones: f.observaciones,
    dictaminadaPor: d ? { id: d.id, username: d.username, rol: comoRol(d.rol, d.id) } : null,
    dictaminadaEn: f.dictaminadaEn,
    creditoId: f.credito?.id ?? null,
    creadaEn: f.creadaEn,
  };
}

export class PrismaSolicitudConsultas implements SolicitudConsultas {
  constructor(private readonly prisma: PrismaClient) {}

  async listar(f: FiltrosSolicitudes): Promise<Paginado<SolicitudVista>> {
    const where: Prisma.SolicitudWhereInput = { estado: f.estado, cedula: f.cedula };
    const orden = f.orden ?? 'desc';
    const [total, filas] = await this.prisma.$transaction([
      this.prisma.solicitud.count({ where }),
      this.prisma.solicitud.findMany({
        where,
        include: INCLUIR,
        orderBy: [{ creadaEn: orden }, { id: orden }],
        skip: (f.page - 1) * f.pageSize,
        take: f.pageSize,
      }),
    ]);
    return { items: filas.map(aVista), total, page: f.page, pageSize: f.pageSize };
  }

  async obtener(id: number): Promise<SolicitudVista | null> {
    const fila = await this.prisma.solicitud.findUnique({ where: { id }, include: INCLUIR });
    return fila ? aVista(fila) : null;
  }
}
