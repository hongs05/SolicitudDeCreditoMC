import type { EstadoSolicitud, Periodicidad, Rol } from '@credito/domain';

export interface ItemCatalogo { id: number; codigo: string; nombre: string }
export interface UsuarioVista { id: number; username: string; rol: Rol }
export interface Paginado<T> { items: T[]; total: number; page: number; pageSize: number }

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

export interface CreditoResumen {
  id: number;
  numero: string;
  cedula: string;
  nombreCompleto: string;
  monto: string;
  plazo: number;
  periodicidad: Periodicidad;
  estado: EstadoSolicitud;
}

export interface DesembolsoResponse {
  id: number;
  creditoId: number;
  banco: ItemCatalogo;
  numeroCuenta: string;
  ejecutadoPor: UsuarioVista;
  ejecutadoEn: string;
}

export interface CreditoResponse extends CreditoResumen {
  tasaAnual: string;
  cuotaNivelada: string;
  solicitudId: number;
  fechaBase: string;
  creadoEn: string;
  desembolso: DesembolsoResponse | null;
}

export interface CuotaResponse {
  numero: number;
  fechaVencimiento: string;
  capital: string;
  interes: string;
  valorCuota: string;
  saldoRestante: string;
}

export interface PlanPagosResponse { credito: CreditoResumen; cuotas: CuotaResponse[] }
export interface DictamenResponse { solicitud: SolicitudResponse; credito: CreditoResponse | null }
