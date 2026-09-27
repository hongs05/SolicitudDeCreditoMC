export const cuerpoSolicitud = (cambios: Record<string, unknown> = {}): Record<string, unknown> => ({
  nombreCompleto: 'Ana López',
  cedula: '0010101900001A',
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
