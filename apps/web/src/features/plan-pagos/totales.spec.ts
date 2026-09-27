import { describe, expect, it } from 'vitest';
import { cuotasResponse } from '../../test/fabricas';
import { proximaCuota, totalesPlan } from './totales';

describe('totales del plan', () => {
  it('suma capital, interés y cuota sin error de redondeo', () => {
    const cuotas = [
      { numero: 1, fechaVencimiento: '2026-10-24', capital: '0.10', interes: '0.20', valorCuota: '0.30', saldoRestante: '0.20' },
      { numero: 2, fechaVencimiento: '2026-11-24', capital: '0.20', interes: '0.10', valorCuota: '0.30', saldoRestante: '0.00' },
    ];
    expect(totalesPlan(cuotas)).toEqual({ capital: 0.3, interes: 0.3, valorCuota: 0.6 });
  });

  it('la próxima cuota es la primera que vence hoy o después', () => {
    const cuotas = cuotasResponse(12);
    expect(proximaCuota(cuotas, '2027-03-24')?.numero).toBe(3);
    expect(proximaCuota(cuotas, '2027-03-25')?.numero).toBe(4);
    expect(proximaCuota(cuotas, '2028-01-01')).toBeUndefined();
  });
});
