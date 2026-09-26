import { describe, expect, it } from 'vitest';
import { type Accion, EstadoSolicitud, esEstadoSolicitud, puedeEjecutar } from './estado-solicitud';

const { PENDIENTE, APROBADA, RECHAZADA, DESEMBOLSADA } = EstadoSolicitud;

describe('puedeEjecutar', () => {
  it.each<[EstadoSolicitud, Accion, boolean]>([
    [PENDIENTE, 'aprobar', true],
    [PENDIENTE, 'rechazar', true],
    [PENDIENTE, 'desembolsar', false],
    [APROBADA, 'aprobar', false],
    [APROBADA, 'rechazar', false],
    [APROBADA, 'desembolsar', true],
    [RECHAZADA, 'aprobar', false],
    [RECHAZADA, 'rechazar', false],
    [RECHAZADA, 'desembolsar', false],
    [DESEMBOLSADA, 'aprobar', false],
    [DESEMBOLSADA, 'rechazar', false],
    [DESEMBOLSADA, 'desembolsar', false],
  ])('%s + %s → %s', (estado, accion, esperado) => {
    expect(puedeEjecutar(estado, accion)).toBe(esperado);
  });

  it('reconoce estados válidos', () => {
    expect(esEstadoSolicitud('APROBADA')).toBe(true);
    expect(esEstadoSolicitud('ANULADA')).toBe(false);
  });
});
