import { Rol } from '@credito/domain';
import { Body, Controller, Post } from '@nestjs/common';
import type { UsuarioSesion } from '../../auth/application/sesion';
import { Roles } from '../../auth/infrastructure/roles.decorator';
import { UsuarioActual } from '../../auth/infrastructure/usuario-actual.decorator';
import { ConsultarCreditos } from '../../creditos/application/consultar-creditos.use-case';
import { aDesembolsoRespuesta, type DesembolsoResponse } from '../../creditos/infrastructure/credito.presentador';
import { Desembolsar } from '../application/desembolsar.use-case';
import { DesembolsarDto } from './desembolso.dto';

@Controller('desembolsos')
export class DesembolsosController {
  constructor(
    private readonly desembolsar: Desembolsar,
    private readonly creditos: ConsultarCreditos,
  ) {}

  @Post()
  @Roles(Rol.CAJERO)
  async crear(@Body() dto: DesembolsarDto, @UsuarioActual() usuario: UsuarioSesion): Promise<DesembolsoResponse> {
    await this.desembolsar.ejecutar({ ...dto, usuarioId: usuario.id });
    const { desembolso } = await this.creditos.obtener(dto.creditoId);
    if (!desembolso) throw new Error(`El crédito ${dto.creditoId} no registró el desembolso`);
    return aDesembolsoRespuesta(desembolso);
  }
}
