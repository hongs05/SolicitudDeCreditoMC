import { describe, expect, it } from 'vitest';
import { aCuerpoSolicitud, crearEsquemaSolicitud, PATRON_DECIMAL, VALORES_INICIALES } from './esquema';
import { resumirSolicitud } from './resumen-solicitud';

const HOY = '2026-09-24';
const MONTO_13_DIGITOS = '1234567890123';

describe('PATRON_DECIMAL', () => {
  it('rechaza más de 12 dígitos enteros', () => {
    expect(PATRON_DECIMAL.test(MONTO_13_DIGITOS)).toBe(false);
    expect(PATRON_DECIMAL.test('123456789012')).toBe(true);
  });
});

describe('crearEsquemaSolicitud', () => {
  it('rechaza un monto de 13 dígitos con FORMATO_INVALIDO', () => {
    const esquema = crearEsquemaSolicitud(HOY, 'es');
    const valores = {
      ...VALORES_INICIALES,
      nombreCompleto: 'Ana López', cedula: '0010101900001A', correo: 'a@a.com', telefono: '88887777',
      fechaNacimiento: '1990-01-01', tipoEmpleoId: '1', empresa: 'Empresa', antiguedadAnios: '5',
      ingresoMensual: '30000', montoSolicitado: MONTO_13_DIGITOS, cantidadCuotas: '12', tasaAnual: '12',
      periodicidad: 'MENSUAL',
    };
    const resultado = esquema.safeParse(valores);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      const problema = resultado.error.issues.find((i) => i.path[0] === 'montoSolicitado');
      expect(problema?.message).toBe('El formato no es válido');
    }
  });

  it('sin plan cuando el monto tiene 13 dígitos', () => {
    const valores = {
      ...VALORES_INICIALES,
      fechaNacimiento: '1990-01-01', montoSolicitado: MONTO_13_DIGITOS, tasaAnual: '12',
      cantidadCuotas: '12', periodicidad: 'MENSUAL',
    };
    expect(resumirSolicitud(valores, HOY).plan).toBeNull();
  });
});

describe('aCuerpoSolicitud', () => {
  const base = {
    ...VALORES_INICIALES,
    nombreCompleto: 'Ana López', cedula: '0010101900001A', correo: 'a@a.com', telefono: '88887777',
    fechaNacimiento: '1990-01-01', tipoEmpleoId: '1', empresa: 'Empresa', antiguedadAnios: '5',
    cantidadCuotas: '12', periodicidad: 'MENSUAL',
  };

  it('formatea "10000" a "10000.00"', () => {
    const cuerpo = aCuerpoSolicitud({ ...base, ingresoMensual: '10000', montoSolicitado: '10000', tasaAnual: '12' });
    expect(cuerpo.montoSolicitado).toBe('10000.00');
  });

  it('formatea "12.5" a "12.50"', () => {
    const cuerpo = aCuerpoSolicitud({ ...base, ingresoMensual: '12.5', montoSolicitado: '12.5', tasaAnual: '12' });
    expect(cuerpo.montoSolicitado).toBe('12.50');
  });

  it('formatea "0.05" a "0.05"', () => {
    const cuerpo = aCuerpoSolicitud({ ...base, ingresoMensual: '0.05', montoSolicitado: '0.05', tasaAnual: '12' });
    expect(cuerpo.montoSolicitado).toBe('0.05');
  });
});

describe('reglas del cliente y del plazo', () => {
  const validos = {
    ...VALORES_INICIALES,
    nombreCompleto: 'Ana López', cedula: '0010101900001A', correo: 'a@a.com', telefono: '8888-7777',
    fechaNacimiento: '1990-01-01', tipoEmpleoId: '1', empresa: 'Empresa', antiguedadAnios: '5',
    ingresoMensual: '30000', montoSolicitado: '10000', cantidadCuotas: '12', tasaAnual: '12',
    periodicidad: 'MENSUAL',
  };
  const errores = (cambios: Record<string, string>) => {
    const r = crearEsquemaSolicitud(HOY, 'es').safeParse({ ...validos, ...cambios });
    return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
  };

  it('acepta los datos válidos', () => {
    expect(errores({})).toEqual({});
  });

  it('rechaza dígitos en el nombre y letras en el teléfono', () => {
    expect(errores({ nombreCompleto: 'Ana 2', telefono: 'no tengo' })).toMatchObject({
      nombreCompleto: 'El formato no es válido', telefono: 'El formato no es válido',
    });
  });

  it('rechaza menores de 18 años', () => {
    expect(errores({ fechaNacimiento: '2010-01-01' }).fechaNacimiento).toBe('El solicitante tiene 16 años y la edad mínima permitida es 18');
  });

  it('rechaza una antigüedad imposible para la edad, aunque otros campos tengan errores', () => {
    const r = errores({ fechaNacimiento: '2000-01-01', antiguedadAnios: '20', correo: '' });
    expect(r.antiguedadAnios).toBe('La antigüedad laboral no puede superar 12 años para un solicitante de 26 años');
    expect(r).toHaveProperty('correo');
  });

  it('rechaza un plazo de más de 30 años según la periodicidad', () => {
    expect(errores({ cantidadCuotas: '31', periodicidad: 'ANUAL' }).cantidadCuotas).toBe('El plazo del crédito no puede superar 30 años');
    expect(errores({ cantidadCuotas: '360', periodicidad: 'QUINCENAL' })).toEqual({});
  });
});
