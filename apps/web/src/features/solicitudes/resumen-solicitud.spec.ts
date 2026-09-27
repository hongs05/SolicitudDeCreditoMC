import { describe, expect, it } from 'vitest';
import { VALORES_INICIALES } from './esquema';
import { resumirSolicitud } from './resumen-solicitud';

const HOY = '2026-09-24';
const caso = (cambios = {}) => ({
  ...VALORES_INICIALES,
  fechaNacimiento: '1990-01-01',
  montoSolicitado: '10000',
  tasaAnual: '12',
  cantidadCuotas: '12',
  periodicidad: 'MENSUAL',
  ...cambios,
});

describe('resumirSolicitud', () => {
  it('calcula edad, cuota y totales del caso A', () => {
    expect(resumirSolicitud(caso(), HOY)).toEqual({
      edad: 36,
      edadExcedida: false,
      plan: { cuota: 888.49, totalPagar: 10661.86, totalIntereses: 661.86 },
    });
  });

  it('sin condiciones completas no hay plan', () => {
    expect(resumirSolicitud(caso({ cantidadCuotas: '' }), HOY).plan).toBeNull();
    expect(resumirSolicitud(caso({ montoSolicitado: 'abc' }), HOY).plan).toBeNull();
    expect(resumirSolicitud(caso({ montoSolicitado: '0' }), HOY).plan).toBeNull();
    expect(resumirSolicitud(caso({ cantidadCuotas: '361' }), HOY).plan).toBeNull();
    expect(resumirSolicitud(caso({ periodicidad: '' }), HOY).plan).toBeNull();
  });

  it('marca la edad excedida', () => {
    expect(resumirSolicitud(caso({ fechaNacimiento: '1945-09-24' }), HOY)).toMatchObject({ edad: 81, edadExcedida: true });
  });

  it('sin fecha válida no hay edad', () => {
    expect(resumirSolicitud(caso({ fechaNacimiento: '' }), HOY).edad).toBeNull();
    expect(resumirSolicitud(caso({ fechaNacimiento: '2999-01-01' }), HOY).edad).toBeNull();
  });
});
