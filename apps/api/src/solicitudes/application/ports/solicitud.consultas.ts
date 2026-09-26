import type { EstadoSolicitud, Periodicidad } from '@credito/domain';
import type { ItemCatalogo, Paginacion, Paginado, UsuarioVista } from '../../../shared/application/vistas';

export interface SolicitudVista {
  id: number;
  estado: EstadoSolicitud;
  nombreCompleto: string;
  cedula: string;
  correo: string;
  telefono: string;
  fechaNacimiento: string;
  tipoEmpleo: ItemCatalogo;
  empresa: string;
  antiguedadAnios: number;
  ingresoMensual: number;
  montoSolicitado: number;
  cantidadCuotas: number;
  tasaAnual: number;
  periodicidad: Periodicidad;
  observaciones: string | null;
  dictaminadaPor: UsuarioVista | null;
  dictaminadaEn: Date | null;
  creditoId: number | null;
  creadaEn: Date;
}

export interface FiltrosSolicitudes extends Paginacion {
  estado?: EstadoSolicitud;
  cedula?: string;
}

export interface SolicitudConsultas {
  listar(filtros: FiltrosSolicitudes): Promise<Paginado<SolicitudVista>>;
  obtener(id: number): Promise<SolicitudVista | null>;
}

export const SOLICITUD_CONSULTAS = Symbol('SolicitudConsultas');
