import { esEstadoSolicitud, esPeriodicidad, Solicitud, type SolicitudPrevia } from '@credito/domain';
import type { Solicitud as SolicitudFila } from '@prisma/client';
import { aDecimal, aNumero, type ClientePrisma } from '../../shared/infrastructure/prisma/decimal';
import type { SolicitudRepository } from '../application/ports/solicitud.repository';

export function aSolicitud(f: SolicitudFila): Solicitud {
  if (!esEstadoSolicitud(f.estado) || !esPeriodicidad(f.periodicidad)) {
    throw new Error(`Solicitud ${f.id} con estado o periodicidad inválidos`);
  }
  return Solicitud.reconstituir({
    id: f.id,
    estado: f.estado,
    nombreCompleto: f.nombreCompleto,
    cedula: f.cedula,
    correo: f.correo,
    telefono: f.telefono,
    fechaNacimiento: f.fechaNacimiento,
    tipoEmpleoId: f.tipoEmpleoId,
    empresa: f.empresa,
    antiguedadAnios: f.antiguedadAnios,
    ingresoMensual: aNumero(f.ingresoMensual),
    montoSolicitado: aNumero(f.montoSolicitado),
    cantidadCuotas: f.cantidadCuotas,
    tasaAnual: aNumero(f.tasaAnual),
    periodicidad: f.periodicidad,
    observaciones: f.observaciones,
    dictaminadaPorId: f.dictaminadaPorId,
    dictaminadaEn: f.dictaminadaEn,
    creadaPorId: f.creadaPorId,
    creadaEn: f.creadaEn,
  });
}

export class PrismaSolicitudRepository implements SolicitudRepository {
  constructor(private readonly db: ClientePrisma) {}

  async obtenerPorId(id: number): Promise<Solicitud | null> {
    const fila = await this.db.solicitud.findUnique({ where: { id } });
    return fila ? aSolicitud(fila) : null;
  }

  async historialPorCedula(cedula: string): Promise<SolicitudPrevia[]> {
    const filas = await this.db.solicitud.findMany({
      where: { cedula },
      select: { id: true, estado: true, fechaNacimiento: true },
      orderBy: { id: 'asc' },
    });
    return filas.map((f) => {
      if (!esEstadoSolicitud(f.estado)) throw new Error(`Solicitud ${f.id} con estado inválido`);
      return { id: f.id, estado: f.estado, fechaNacimiento: f.fechaNacimiento };
    });
  }

  async crear(solicitud: Solicitud): Promise<Solicitud> {
    const p = solicitud.snapshot();
    const fila = await this.db.solicitud.create({
      data: {
        estado: p.estado,
        nombreCompleto: p.nombreCompleto,
        cedula: p.cedula,
        correo: p.correo,
        telefono: p.telefono,
        fechaNacimiento: p.fechaNacimiento,
        tipoEmpleoId: p.tipoEmpleoId,
        empresa: p.empresa,
        antiguedadAnios: p.antiguedadAnios,
        ingresoMensual: aDecimal(p.ingresoMensual),
        montoSolicitado: aDecimal(p.montoSolicitado),
        cantidadCuotas: p.cantidadCuotas,
        tasaAnual: aDecimal(p.tasaAnual),
        periodicidad: p.periodicidad,
        creadaPorId: p.creadaPorId,
        creadaEn: p.creadaEn,
      },
    });
    return aSolicitud(fila);
  }

  async guardar(solicitud: Solicitud): Promise<void> {
    const p = solicitud.snapshot();
    if (p.id === null) throw new Error('No se puede guardar una solicitud sin id');
    await this.db.solicitud.update({
      where: { id: p.id },
      data: {
        estado: p.estado,
        observaciones: p.observaciones,
        dictaminadaPorId: p.dictaminadaPorId,
        dictaminadaEn: p.dictaminadaEn,
      },
    });
  }
}
