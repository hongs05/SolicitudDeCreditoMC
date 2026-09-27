import { describe, expect, it } from 'vitest';
import { CreditoNoAprobadoError } from '../errors/errores';
import { Solicitud } from '../solicitud/solicitud';
import { datosValidos } from '../testing/fixtures';
import { Credito, formatearNumeroCredito } from './credito';
import { Periodicidad } from './periodicidad';

const AHORA = new Date('2026-09-24T15:00:00Z');

const aprobada = () => {
  const s = Solicitud.reconstituir({ ...Solicitud.crear(datosValidos(), 7, '2026-09-24', AHORA).snapshot(), id: 5 });
  s.aprobar('ok', 9, AHORA);
  return s;
};

describe('formatearNumeroCredito', () => {
  it.each([
    [1, 'CR-000001'],
    [42, 'CR-000042'],
    [999999, 'CR-999999'],
    [1000000, 'CR-1000000'],
  ])('%d → %s', (secuencia, esperado) => {
    expect(formatearNumeroCredito(secuencia)).toBe(esperado);
  });
});

describe('Credito.desde', () => {
  it('congela las condiciones de la solicitud aprobada', () => {
    const credito = Credito.desde(aprobada(), 1, '2026-01-31');
    expect(credito.snapshot()).toEqual({
      id: null,
      secuencia: 1,
      numero: 'CR-000001',
      solicitudId: 5,
      monto: 10000,
      tasaAnual: 12,
      periodicidad: Periodicidad.MENSUAL,
      plazo: 12,
      cuotaNivelada: 888.49,
      fechaBase: '2026-01-31',
    });
  });

  it('genera el plan del caso A', () => {
    const plan = Credito.desde(aprobada(), 1, '2026-01-31').generarPlan();
    expect(plan).toHaveLength(12);
    expect(plan[0]).toEqual({
      numero: 1, fechaVencimiento: '2026-02-28',
      capital: 788.49, interes: 100, valorCuota: 888.49, saldoRestante: 9211.51,
    });
  });

  it('exige una solicitud aprobada', () => {
    const pendiente = Solicitud.reconstituir({ ...aprobada().snapshot(), estado: 'PENDIENTE' as never });
    expect(() => Credito.desde(pendiente, 1, '2026-01-31')).toThrow(CreditoNoAprobadoError);
  });

  it('exige una solicitud persistida', () => {
    const sinId = Solicitud.reconstituir({ ...aprobada().snapshot(), id: null });
    expect(() => Credito.desde(sinId, 1, '2026-01-31')).toThrow('persistida');
  });
});
