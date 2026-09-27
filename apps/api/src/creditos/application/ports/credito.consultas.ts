import type { CuotaPlan, EstadoSolicitud, Periodicidad } from '@credito/domain';
import type { ItemCatalogo, Paginacion, Paginado, UsuarioVista } from '../../../shared/application/vistas';

export interface DesembolsoVista {
  id: number;
  creditoId: number;
  banco: ItemCatalogo;
  numeroCuenta: string;
  ejecutadoPor: UsuarioVista;
  ejecutadoEn: Date;
}

export interface CreditoVista {
  id: number;
  numero: string;
  solicitudId: number;
  cedula: string;
  nombreCompleto: string;
  monto: number;
  tasaAnual: number;
  periodicidad: Periodicidad;
  plazo: number;
  cuotaNivelada: number;
  fechaBase: string;
  estado: EstadoSolicitud;
  creadoEn: Date;
  desembolso: DesembolsoVista | null;
}

export interface FiltrosCreditos extends Paginacion {
  estado?: EstadoSolicitud;
  cedula?: string;
  numero?: string;
}

export interface CreditoConsultas {
  listar(filtros: FiltrosCreditos): Promise<Paginado<CreditoVista>>;
  obtener(id: number): Promise<CreditoVista | null>;
  cuotas(creditoId: number): Promise<CuotaPlan[]>;
}

export const CREDITO_CONSULTAS = Symbol('CreditoConsultas');
