import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CONFIGURACION, type Configuracion } from '../../shared/infrastructure/config/configuracion';
import { Public } from '../../shared/infrastructure/http/publico.decorator';
import { CerrarSesion } from '../application/cerrar-sesion.use-case';
import { Login } from '../application/login.use-case';
import { RefrescarSesion } from '../application/refrescar-sesion.use-case';
import type { SesionEmitida, UsuarioSesion } from '../application/sesion';
import { LoginDto } from './auth.dto';
import { NOMBRE_COOKIE_REFRESH, opcionesCookie } from './cookie';
import { UsuarioActual } from './usuario-actual.decorator';

export interface TokensResponse {
  accessToken: string;
  usuario: UsuarioSesion;
}

const cookieDe = (peticion: Request): string | undefined =>
  (peticion.cookies as Record<string, string> | undefined)?.[NOMBRE_COOKIE_REFRESH];

@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: Login,
    private readonly refrescar: RefrescarSesion,
    private readonly cerrar: CerrarSesion,
    @Inject(CONFIGURACION) private readonly config: Configuracion,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async iniciar(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<TokensResponse> {
    return this.responder(await this.login.ejecutar(dto.username, dto.password), res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<TokensResponse> {
    return this.responder(await this.refrescar.ejecutar(cookieDe(req)), res);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.cerrar.ejecutar(cookieDe(req));
    res.clearCookie(NOMBRE_COOKIE_REFRESH, opcionesCookie(this.config));
  }

  @Get('me')
  me(@UsuarioActual() usuario: UsuarioSesion): UsuarioSesion {
    return usuario;
  }

  private responder(sesion: SesionEmitida, res: Response): TokensResponse {
    res.cookie(NOMBRE_COOKIE_REFRESH, sesion.refreshToken, opcionesCookie(this.config, sesion.refreshExpiraEn));
    return { accessToken: sesion.accessToken, usuario: sesion.usuario };
  }
}
