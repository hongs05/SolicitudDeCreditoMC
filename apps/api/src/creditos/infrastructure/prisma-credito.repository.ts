import { Credito, type CuotaPlan, esPeriodicidad } from '@credito/domain';
import type { Credito as CreditoFila } from '@prisma/client';
import { aDecimal, aNumero, type ClientePrisma } from '../../shared/infrastructure/prisma/decimal';
import type { CreditoRepository } from '../application/ports/credito.repository';

export function aCredito(f: CreditoFila): Credito {
  if (!esPeriodicidad(f.periodicidad)) throw new Error(`Crédito ${f.id} con periodicidad inválida`);
  return Credito.reconstituir({
    id: f.id,
    secuencia: f.secuencia,
    numero: f.numero,
    solicitudId: f.solicitudId,
    monto: aNumero(f.monto),
    tasaAnual: aNumero(f.tasaAnual),
    periodicidad: f.periodicidad,
    plazo: f.plazo,
    cuotaNivelada: aNumero(f.cuotaNivelada),
    fechaBase: f.fechaBase,
  });
}

export class PrismaCreditoRepository implements CreditoRepository {
  constructor(protected readonly db: ClientePrisma) {}

  async siguienteSecuencia(): Promise<number> {
    const resultado = await this.db.credito.aggregate({ _max: { secuencia: true } });
    return (resultado._max.secuencia ?? 0) + 1;
  }

  async crear(credito: Credito, cuotas: CuotaPlan[]): Promise<Credito> {
    const p = credito.snapshot();
    const fila = await this.db.credito.create({
      data: {
        secuencia: p.secuencia,
        numero: p.numero,
        solicitudId: p.solicitudId,
        monto: aDecimal(p.monto),
        tasaAnual: aDecimal(p.tasaAnual),
        periodicidad: p.periodicidad,
        plazo: p.plazo,
        cuotaNivelada: aDecimal(p.cuotaNivelada),
        fechaBase: p.fechaBase,
      },
    });
    await this.insertarCuotas(fila.id, cuotas);
    return aCredito(fila);
  }

  async obtenerPorId(id: number): Promise<Credito | null> {
    const fila = await this.db.credito.findUnique({ where: { id } });
    return fila ? aCredito(fila) : null;
  }

  protected async insertarCuotas(creditoId: number, cuotas: CuotaPlan[]): Promise<void> {
    await this.db.cuota.createMany({
      data: cuotas.map((c) => ({
        creditoId,
        numero: c.numero,
        fechaVencimiento: c.fechaVencimiento,
        capital: aDecimal(c.capital),
        interes: aDecimal(c.interes),
        valorCuota: aDecimal(c.valorCuota),
        saldoRestante: aDecimal(c.saldoRestante),
      })),
    });
  }
}
