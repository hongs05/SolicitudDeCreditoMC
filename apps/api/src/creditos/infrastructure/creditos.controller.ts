import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import type { Paginado } from '../../shared/application/vistas';
import { ConsultarCreditos } from '../application/consultar-creditos.use-case';
import {
  aCreditoRespuesta, aCreditoResumen, aCuotaRespuesta,
  type CreditoResponse, type CreditoResumen, type PlanPagosResponse,
} from './credito.presentador';
import { FiltrosCreditosDto } from './creditos.dto';

@Controller('creditos')
export class CreditosController {
  constructor(private readonly consultar: ConsultarCreditos) {}

  @Get()
  async listar(@Query() filtros: FiltrosCreditosDto): Promise<Paginado<CreditoResumen>> {
    const pagina = await this.consultar.listar(filtros);
    return { ...pagina, items: pagina.items.map(aCreditoResumen) };
  }

  @Get(':id')
  async obtener(@Param('id', ParseIntPipe) id: number): Promise<CreditoResponse> {
    return aCreditoRespuesta(await this.consultar.obtener(id));
  }

  @Get(':id/plan-pagos')
  async planPagos(@Param('id', ParseIntPipe) id: number): Promise<PlanPagosResponse> {
    const { credito, cuotas } = await this.consultar.planPagos(id);
    return { credito: aCreditoResumen(credito), cuotas: cuotas.map(aCuotaRespuesta) };
  }
}
