import type { CuotaPlan, EstadoSolicitud, Periodicidad } from '@credito/domain';
import type { ItemCatalogo, UsuarioVista } from '../../shared/application/vistas';
import { dinero } from '../../shared/infrastructure/http/formato';
import type { CreditoVista, DesembolsoVista } from '../application/ports/credito.consultas';

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

export interface PlanPagosResponse {
  credito: CreditoResumen;
  cuotas: CuotaResponse[];
}

export const aCreditoResumen = (v: CreditoVista): CreditoResumen => ({
  id: v.id,
  numero: v.numero,
  cedula: v.cedula,
  nombreCompleto: v.nombreCompleto,
  monto: dinero(v.monto),
  plazo: v.plazo,
  periodicidad: v.periodicidad,
  estado: v.estado,
});

export const aDesembolsoRespuesta = (d: DesembolsoVista): DesembolsoResponse => ({
  id: d.id,
  creditoId: d.creditoId,
  banco: d.banco,
  numeroCuenta: d.numeroCuenta,
  ejecutadoPor: d.ejecutadoPor,
  ejecutadoEn: d.ejecutadoEn.toISOString(),
});

export const aCreditoRespuesta = (v: CreditoVista): CreditoResponse => ({
  ...aCreditoResumen(v),
  tasaAnual: dinero(v.tasaAnual),
  cuotaNivelada: dinero(v.cuotaNivelada),
  solicitudId: v.solicitudId,
  fechaBase: v.fechaBase,
  creadoEn: v.creadoEn.toISOString(),
  desembolso: v.desembolso ? aDesembolsoRespuesta(v.desembolso) : null,
});

export const aCuotaRespuesta = (c: CuotaPlan): CuotaResponse => ({
  numero: c.numero,
  fechaVencimiento: c.fechaVencimiento,
  capital: dinero(c.capital),
  interes: dinero(c.interes),
  valorCuota: dinero(c.valorCuota),
  saldoRestante: dinero(c.saldoRestante),
});
