import { type CuotaPlan, NoEncontradoError } from '@credito/domain';
import type { Paginado } from '../../shared/application/vistas';
import type { CreditoConsultas, CreditoVista, FiltrosCreditos } from './ports/credito.consultas';

export class ConsultarCreditos {
  constructor(private readonly consultas: CreditoConsultas) {}

  listar(filtros: FiltrosCreditos): Promise<Paginado<CreditoVista>> {
    return this.consultas.listar(filtros);
  }

  async obtener(id: number): Promise<CreditoVista> {
    const credito = await this.consultas.obtener(id);
    if (!credito) throw new NoEncontradoError('Credito');
    return credito;
  }

  async planPagos(id: number): Promise<{ credito: CreditoVista; cuotas: CuotaPlan[] }> {
    const credito = await this.obtener(id);
    return { credito, cuotas: await this.consultas.cuotas(id) };
  }
}
