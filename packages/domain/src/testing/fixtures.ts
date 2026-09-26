import { Periodicidad } from '../credito/periodicidad';
import type { DatosSolicitud } from '../solicitud/solicitud';

export const datosValidos = (cambios: Partial<DatosSolicitud> = {}): DatosSolicitud => ({
  nombreCompleto: 'Ana López',
  cedula: '001-010190-0001A',
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
