import type { EstadoSolicitud, Periodicidad } from '@credito/domain';
import type { CreditoResponse } from '../../creditos/infrastructure/credito.presentador';
import type { ItemCatalogo, UsuarioVista } from '../../shared/application/vistas';
import { dinero } from '../../shared/infrastructure/http/formato';
import type { SolicitudDetalle } from '../application/consultar-solicitudes.use-case';
import type { SolicitudVista } from '../application/ports/solicitud.consultas';

export interface SolicitudResumen {
  id: number;
  cedula: string;
  nombreCompleto: string;
  montoSolicitado: string;
  cantidadCuotas: number;
  periodicidad: Periodicidad;
  estado: EstadoSolicitud;
  creadaEn: string;
}

export interface SolicitudResponse extends SolicitudResumen {
  edad: number;
  correo: string;
  telefono: string;
  fechaNacimiento: string;
  tipoEmpleo: ItemCatalogo;
  empresa: string;
  antiguedadAnios: number;
  ingresoMensual: string;
  tasaAnual: string;
  cuotaNivelada: string;
  observaciones: string | null;
  dictaminadaPor: UsuarioVista | null;
  dictaminadaEn: string | null;
  creditoId: number | null;
}

export interface DictamenResponse {
  solicitud: SolicitudResponse;
  credito: CreditoResponse | null;
}

export const aSolicitudResumen = (v: SolicitudVista): SolicitudResumen => ({
  id: v.id,
  cedula: v.cedula,
  nombreCompleto: v.nombreCompleto,
  montoSolicitado: dinero(v.montoSolicitado),
  cantidadCuotas: v.cantidadCuotas,
  periodicidad: v.periodicidad,
  estado: v.estado,
  creadaEn: v.creadaEn.toISOString(),
});

export const aSolicitudRespuesta = (d: SolicitudDetalle): SolicitudResponse => ({
  ...aSolicitudResumen(d),
  edad: d.edad,
  correo: d.correo,
  telefono: d.telefono,
  fechaNacimiento: d.fechaNacimiento,
  tipoEmpleo: d.tipoEmpleo,
  empresa: d.empresa,
  antiguedadAnios: d.antiguedadAnios,
  ingresoMensual: dinero(d.ingresoMensual),
  tasaAnual: dinero(d.tasaAnual),
  cuotaNivelada: dinero(d.cuotaNivelada),
  observaciones: d.observaciones,
  dictaminadaPor: d.dictaminadaPor,
  dictaminadaEn: d.dictaminadaEn?.toISOString() ?? null,
  creditoId: d.creditoId,
});
