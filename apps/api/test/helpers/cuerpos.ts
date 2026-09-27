let siguienteCedula = 1;

/** Cada solicitud usa una cédula nueva: una cédula no puede tener dos solicitudes abiertas. */
export const cedulaUnica = (): string => `0010101900${String(siguienteCedula++).padStart(3, '0')}A`;

export const cuerpoSolicitud = (cambios: Record<string, unknown> = {}): Record<string, unknown> => ({
  nombreCompleto: 'Ana López',
  cedula: cedulaUnica(),
  correo: 'ana@example.com',
  telefono: '88887777',
  fechaNacimiento: '1990-01-01',
  tipoEmpleoId: 1,
  empresa: 'Empresa S.A.',
  antiguedadAnios: 5,
  ingresoMensual: '30000.00',
  montoSolicitado: '10000.00',
  cantidadCuotas: 12,
  tasaAnual: '12.00',
  periodicidad: 'MENSUAL',
  ...cambios,
});

export const fechaHaceAnios = (anios: number): string => `${new Date().getUTCFullYear() - anios}-01-01`;
