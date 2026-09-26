import type { Credito, CuotaPlan } from '@credito/domain';

export interface CreditoRepository {
  siguienteSecuencia(): Promise<number>;
  crear(credito: Credito, cuotas: CuotaPlan[]): Promise<Credito>;
  obtenerPorId(id: number): Promise<Credito | null>;
}
