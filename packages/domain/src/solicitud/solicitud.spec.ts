import { describe, expect, it } from 'vitest';
import {
  CreditoNoAprobadoError, CreditoYaDesembolsadoError, EdadMaximaExcedidaError,
  ObservacionesRequeridasError, ParametrosCreditoInvalidosError, TransicionInvalidaError,
} from '../errors/errores';
import { datosValidos } from '../testing/fixtures';
import { EstadoSolicitud } from './estado-solicitud';
import { Solicitud } from './solicitud';

const HOY = '2026-09-24';
const AHORA = new Date('2026-09-24T15:00:00Z');

const pendiente = () => {
  const s = Solicitud.crear(datosValidos(), 7, HOY, AHORA);
  return Solicitud.reconstituir({ ...s.snapshot(), id: 1 });
};

describe('Solicitud.crear', () => {
  it('crea en PENDIENTE sin dictamen', () => {
    const s = Solicitud.crear(datosValidos(), 7, HOY, AHORA);
    expect(s.estado).toBe(EstadoSolicitud.PENDIENTE);
    expect(s.id).toBeNull();
    expect(s.snapshot()).toMatchObject({
      creadaPorId: 7, creadaEn: AHORA, observaciones: null,
      dictaminadaPorId: null, dictaminadaEn: null,
    });
  });

  it('acepta exactamente 80 años', () => {
    expect(() => Solicitud.crear(datosValidos({ fechaNacimiento: '1946-01-01' }), 7, HOY, AHORA)).not.toThrow();
  });

  it('rechaza mayores de 80 años', () => {
    expect(() => Solicitud.crear(datosValidos({ fechaNacimiento: '1945-09-24' }), 7, HOY, AHORA))
      .toThrow(EdadMaximaExcedidaError);
  });

  it('rechaza condiciones inválidas', () => {
    expect(() => Solicitud.crear(datosValidos({ montoSolicitado: 0 }), 7, HOY, AHORA))
      .toThrow(ParametrosCreditoInvalidosError);
  });

  it('calcula edad y cuota', () => {
    const s = pendiente();
    expect(s.edad(HOY)).toBe(36);
    expect(s.cuotaNivelada()).toBe(888.49);
  });
});

describe('dictamen', () => {
  it('aprobar llena el dictamen con observaciones recortadas', () => {
    const s = pendiente();
    s.aprobar('  Buen historial  ', 9, AHORA);
    expect(s.estado).toBe(EstadoSolicitud.APROBADA);
    expect(s.snapshot()).toMatchObject({
      observaciones: 'Buen historial', dictaminadaPorId: 9, dictaminadaEn: AHORA,
    });
  });

  it('rechazar pasa a RECHAZADA', () => {
    const s = pendiente();
    s.rechazar('Ingresos insuficientes', 9, AHORA);
    expect(s.estado).toBe(EstadoSolicitud.RECHAZADA);
  });

  it('exige observaciones no vacías', () => {
    expect(() => pendiente().aprobar('   ', 9, AHORA)).toThrow(ObservacionesRequeridasError);
    expect(() => pendiente().rechazar('', 9, AHORA)).toThrow(ObservacionesRequeridasError);
  });

  it('valida el estado antes que las observaciones', () => {
    const s = pendiente();
    s.aprobar('ok', 9, AHORA);
    expect(() => s.aprobar('', 9, AHORA)).toThrow(TransicionInvalidaError);
  });

  it('no permite dictaminar dos veces', () => {
    const s = pendiente();
    s.rechazar('no', 9, AHORA);
    expect(() => s.aprobar('sí', 9, AHORA)).toThrow(TransicionInvalidaError);
  });
});

describe('desembolsar', () => {
  it('pasa de APROBADA a DESEMBOLSADA', () => {
    const s = pendiente();
    s.aprobar('ok', 9, AHORA);
    s.desembolsar();
    expect(s.estado).toBe(EstadoSolicitud.DESEMBOLSADA);
  });

  it('rechaza PENDIENTE y RECHAZADA con CREDITO_NO_APROBADO', () => {
    expect(() => pendiente().desembolsar()).toThrow(CreditoNoAprobadoError);
    const rechazada = pendiente();
    rechazada.rechazar('no', 9, AHORA);
    expect(() => rechazada.desembolsar()).toThrow(CreditoNoAprobadoError);
  });

  it('rechaza DESEMBOLSADA con CREDITO_YA_DESEMBOLSADO', () => {
    const s = pendiente();
    s.aprobar('ok', 9, AHORA);
    s.desembolsar();
    expect(() => s.desembolsar()).toThrow(CreditoYaDesembolsadoError);
  });
});

describe('snapshot', () => {
  it('devuelve una copia que no altera la entidad', () => {
    const s = pendiente();
    const copia = s.snapshot();
    copia.estado = EstadoSolicitud.DESEMBOLSADA;
    expect(s.estado).toBe(EstadoSolicitud.PENDIENTE);
  });
});
