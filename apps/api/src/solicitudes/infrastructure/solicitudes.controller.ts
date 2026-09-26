import { Rol } from '@credito/domain';
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import type { UsuarioSesion } from '../../auth/application/sesion';
import { Roles } from '../../auth/infrastructure/roles.decorator';
import { UsuarioActual } from '../../auth/infrastructure/usuario-actual.decorator';
import { ConsultarCreditos } from '../../creditos/application/consultar-creditos.use-case';
import { aCreditoRespuesta } from '../../creditos/infrastructure/credito.presentador';
import type { Paginado } from '../../shared/application/vistas';
import { AprobarSolicitud } from '../application/aprobar-solicitud.use-case';
import { ConsultarSolicitudes } from '../application/consultar-solicitudes.use-case';
import { CrearSolicitud } from '../application/crear-solicitud.use-case';
import { RechazarSolicitud } from '../application/rechazar-solicitud.use-case';
import { aDatosSolicitud, CrearSolicitudDto, DictamenDto, FiltrosSolicitudesDto } from './solicitud.dto';
import {
  aSolicitudRespuesta, aSolicitudResumen,
  type DictamenResponse, type SolicitudResponse, type SolicitudResumen,
} from './solicitud.presentador';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(
    private readonly crearSolicitud: CrearSolicitud,
    private readonly aprobarSolicitud: AprobarSolicitud,
    private readonly rechazarSolicitud: RechazarSolicitud,
    private readonly consultar: ConsultarSolicitudes,
    private readonly creditos: ConsultarCreditos,
  ) {}

  @Post()
  @Roles(Rol.OFICIAL)
  async crear(@Body() dto: CrearSolicitudDto, @UsuarioActual() usuario: UsuarioSesion): Promise<SolicitudResponse> {
    const id = await this.crearSolicitud.ejecutar(aDatosSolicitud(dto), usuario.id);
    return aSolicitudRespuesta(await this.consultar.obtener(id));
  }

  @Get()
  async listar(@Query() filtros: FiltrosSolicitudesDto): Promise<Paginado<SolicitudResumen>> {
    const pagina = await this.consultar.listar(filtros);
    return { ...pagina, items: pagina.items.map(aSolicitudResumen) };
  }

  @Get(':id')
  async obtener(@Param('id', ParseIntPipe) id: number): Promise<SolicitudResponse> {
    return aSolicitudRespuesta(await this.consultar.obtener(id));
  }

  @Post(':id/aprobar')
  @Roles(Rol.ANALISTA)
  @HttpCode(200)
  async aprobar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DictamenDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ): Promise<DictamenResponse> {
    const { creditoId } = await this.aprobarSolicitud.ejecutar({
      solicitudId: id, observaciones: dto.observaciones, usuarioId: usuario.id,
    });
    return {
      solicitud: aSolicitudRespuesta(await this.consultar.obtener(id)),
      credito: aCreditoRespuesta(await this.creditos.obtener(creditoId)),
    };
  }

  @Post(':id/rechazar')
  @Roles(Rol.ANALISTA)
  @HttpCode(200)
  async rechazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DictamenDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ): Promise<DictamenResponse> {
    await this.rechazarSolicitud.ejecutar({ solicitudId: id, observaciones: dto.observaciones, usuarioId: usuario.id });
    return { solicitud: aSolicitudRespuesta(await this.consultar.obtener(id)), credito: null };
  }
}
