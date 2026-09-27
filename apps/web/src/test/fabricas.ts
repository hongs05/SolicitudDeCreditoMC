import { EstadoSolicitud, Periodicidad, Rol } from '@credito/domain';
import type { CreditoResponse, CuotaResponse, Paginado, SolicitudResponse } from '../shared/api/tipos';

export const solicitudResponse = (cambios: Partial<SolicitudResponse> = {}): SolicitudResponse => ({
  id: 5,
  cedula: '0010101900001A',
  nombreCompleto: 'Ana López',
  montoSolicitado: '10000.00',
  cantidadCuotas: 24,
  periodicidad: Periodicidad.QUINCENAL,
  estado: EstadoSolicitud.PENDIENTE,
  creadaEn: '2026-09-24T15:00:00.000Z',
  edad: 36,
  correo: 'ana@example.com',
  telefono: '88887777',
  fechaNacimiento: '1990-01-01',
  tipoEmpleo: { id: 1, codigo: 'ASALARIADO', nombre: 'Asalariado' },
  empresa: 'Empresa Secreta S.A.',
  antiguedadAnios: 5,
  ingresoMensual: '30000.00',
  tasaAnual: '24.00',
  cuotaNivelada: '528.71',
  observaciones: null,
  dictaminadaPor: null,
  dictaminadaEn: null,
  creditoId: null,
  ...cambios,
});

export const creditoResponse = (cambios: Partial<CreditoResponse> = {}): CreditoResponse => ({
  id: 9,
  numero: 'CR-000001',
  cedula: '0010101900001A',
  nombreCompleto: 'Ana López',
  monto: '10000.00',
  plazo: 12,
  periodicidad: Periodicidad.MENSUAL,
  estado: EstadoSolicitud.APROBADA,
  tasaAnual: '12.00',
  cuotaNivelada: '888.49',
  solicitudId: 5,
  fechaBase: '2026-09-24',
  creadoEn: '2026-09-24T15:00:00.000Z',
  desembolso: null,
  ...cambios,
});

export const cuotasResponse = (n = 12): CuotaResponse[] =>
  Array.from({ length: n }, (_, k) => ({
    numero: k + 1,
    fechaVencimiento: `2027-${String((k % 12) + 1).padStart(2, '0')}-24`,
    capital: '800.00',
    interes: '88.49',
    valorCuota: '888.49',
    saldoRestante: String(((n - k - 1) * 800).toFixed(2)),
  }));

export const paginado = <T>(items: T[]): Paginado<T> => ({ items, total: items.length, page: 1, pageSize: 20 });

export const usuarios = {
  oficial: { id: 1, username: 'oficial', rol: Rol.OFICIAL },
  analista: { id: 2, username: 'analista', rol: Rol.ANALISTA },
  cajero: { id: 3, username: 'cajero', rol: Rol.CAJERO },
};
