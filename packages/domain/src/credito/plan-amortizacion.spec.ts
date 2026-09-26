import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ParametrosCreditoInvalidosError } from '../errors/errores';
import { calcularCuotaNivelada } from './cuota-nivelada';
import { aCentavos } from './dinero';
import { Periodicidad, PERIODOS_POR_ANIO } from './periodicidad';
import { type CuotaPlan, generarPlanAmortizacion } from './plan-amortizacion';

const fila = (plan: CuotaPlan[], numero: number) => {
  const { capital, interes, valorCuota, saldoRestante } = plan[numero - 1]!;
  return [capital, interes, valorCuota, saldoRestante];
};
const sumaCentavos = (plan: CuotaPlan[], campo: 'capital' | 'interes') =>
  plan.reduce((total, cuota) => total + aCentavos(cuota[campo]), 0);

describe('generarPlanAmortizacion: casos de referencia', () => {
  it('A: 10 000 al 12 %, 12 cuotas mensuales', () => {
    const plan = generarPlanAmortizacion({
      monto: 10000, tasaAnual: 12, cuotas: 12,
      periodicidad: Periodicidad.MENSUAL, fechaBase: '2026-01-31',
    });
    expect(plan).toHaveLength(12);
    expect(fila(plan, 1)).toEqual([788.49, 100, 888.49, 9211.51]);
    expect(fila(plan, 2)).toEqual([796.37, 92.12, 888.49, 8415.14]);
    expect(fila(plan, 11)).toEqual([870.98, 17.51, 888.49, 879.67]);
    expect(fila(plan, 12)).toEqual([879.67, 8.8, 888.47, 0]);
    expect(sumaCentavos(plan, 'capital')).toBe(1_000_000);
    expect(sumaCentavos(plan, 'interes')).toBe(66_186);
    expect(plan[0]!.fechaVencimiento).toBe('2026-02-28');
    expect(plan[11]!.fechaVencimiento).toBe('2027-01-31');
  });

  it('B: 1 000 al 0 %, 3 cuotas mensuales', () => {
    const plan = generarPlanAmortizacion({
      monto: 1000, tasaAnual: 0, cuotas: 3,
      periodicidad: Periodicidad.MENSUAL, fechaBase: '2026-01-10',
    });
    expect(fila(plan, 1)).toEqual([333.33, 0, 333.33, 666.67]);
    expect(fila(plan, 2)).toEqual([333.33, 0, 333.33, 333.34]);
    expect(fila(plan, 3)).toEqual([333.34, 0, 333.34, 0]);
  });

  it('C: 5 000 al 10 %, 2 cuotas anuales', () => {
    const plan = generarPlanAmortizacion({
      monto: 5000, tasaAnual: 10, cuotas: 2,
      periodicidad: Periodicidad.ANUAL, fechaBase: '2026-01-10',
    });
    expect(fila(plan, 1)).toEqual([2380.95, 500, 2880.95, 2619.05]);
    expect(fila(plan, 2)).toEqual([2619.05, 261.91, 2880.96, 0]);
  });

  it('D: 2 000 al 24 %, 24 cuotas quincenales', () => {
    const plan = generarPlanAmortizacion({
      monto: 2000, tasaAnual: 24, cuotas: 24,
      periodicidad: Periodicidad.QUINCENAL, fechaBase: '2026-01-10',
    });
    expect(fila(plan, 1)).toEqual([74.15, 20, 94.15, 1925.85]);
    expect(fila(plan, 2)).toEqual([74.89, 19.26, 94.15, 1850.96]);
    expect(fila(plan, 23)).toEqual([92.3, 1.85, 94.15, 93.13]);
    expect(fila(plan, 24)).toEqual([93.13, 0.93, 94.06, 0]);
    expect(plan[0]!.fechaVencimiento).toBe('2026-01-25');
    expect(plan[23]!.fechaVencimiento).toBe('2027-01-10');
  });
});

describe('generarPlanAmortizacion: casos límite', () => {
  it('con un monto diminuto el saldo nunca es negativo y el capital suma el monto', () => {
    const plan = generarPlanAmortizacion({
      monto: 0.09, tasaAnual: 0, cuotas: 6,
      periodicidad: Periodicidad.MENSUAL, fechaBase: '2026-01-10',
    });
    expect(plan).toHaveLength(6);
    expect(sumaCentavos(plan, 'capital')).toBe(9);
    expect(plan.every((c) => c.saldoRestante >= 0 && c.capital >= 0)).toBe(true);
    expect(plan[5]!.saldoRestante).toBe(0);
  });

  it('con 360 cuotas al 24 % el saldo nunca es negativo y el capital suma el monto', () => {
    const plan = generarPlanAmortizacion({
      monto: 100000, tasaAnual: 24, cuotas: 360,
      periodicidad: Periodicidad.MENSUAL, fechaBase: '2026-01-10',
    });
    expect(plan).toHaveLength(360);
    expect(sumaCentavos(plan, 'capital')).toBe(10_000_000);
    expect(plan.every((c) => c.saldoRestante >= 0 && c.interes >= 0)).toBe(true);
    expect(plan[359]!.saldoRestante).toBe(0);
  });
});

describe('generarPlanAmortizacion: invariantes', () => {
  const periodicidad = fc.constantFrom(Periodicidad.MENSUAL, Periodicidad.QUINCENAL, Periodicidad.ANUAL);

  it('se cumplen para condiciones realistas', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000_000 }),
        fc.integer({ min: 0, max: 10_000 }),
        periodicidad.chain((p) =>
          fc.tuple(fc.constant(p), fc.integer({ min: 1, max: 30 * PERIODOS_POR_ANIO[p] })),
        ),
        (montoCentavos, tasaCentesimas, [periodicidad, cuotas]) => {
          const condiciones = {
            monto: montoCentavos / 100,
            tasaAnual: tasaCentesimas / 100,
            cuotas,
            periodicidad,
          };
          let plan: CuotaPlan[];
          let cuotaNivelada: number;
          try {
            plan = generarPlanAmortizacion({ ...condiciones, fechaBase: '2026-01-31' });
            cuotaNivelada = calcularCuotaNivelada(condiciones);
          } catch (error) {
            if (error instanceof ParametrosCreditoInvalidosError) {
              fc.pre(false);
              return;
            }
            throw error;
          }

          expect(plan).toHaveLength(cuotas);
          expect(sumaCentavos(plan, 'capital')).toBe(montoCentavos);
          expect(plan[cuotas - 1]!.saldoRestante).toBe(0);
          for (const cuota of plan) {
            expect(cuota.interes).toBeGreaterThanOrEqual(0);
            expect(cuota.capital).toBeGreaterThanOrEqual(0);
            expect(cuota.saldoRestante).toBeGreaterThanOrEqual(0);
          }

          // La cuota nivelada se paga tal cual hasta que el saldo llega a cero (k0).
          // A partir de ahí (crédito saldado por redondeo antes del plazo nominal) las
          // cuotas restantes valen cero.
          const k0 = plan.findIndex((c) => c.saldoRestante === 0);
          expect(k0).toBeGreaterThanOrEqual(0);

          for (const cuota of plan.slice(0, k0)) {
            expect(cuota.valorCuota).toBe(cuotaNivelada);
          }

          const cuotaK0 = plan[k0]!;
          expect(cuotaK0.valorCuota).toBeGreaterThan(0);
          if (k0 < cuotas - 1) {
            expect(cuotaK0.valorCuota).toBeLessThanOrEqual(cuotaNivelada);
          }

          for (const cuota of plan.slice(k0 + 1)) {
            expect(cuota.capital).toBe(0);
            expect(cuota.interes).toBe(0);
            expect(cuota.valorCuota).toBe(0);
            expect(cuota.saldoRestante).toBe(0);
          }
        },
      ),
      { numRuns: 300 },
    );
  });
});
