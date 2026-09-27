import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { CLOCK, type Clock } from '../../shared/application/ports/clock';
import { UNIT_OF_WORK, type UnitOfWork } from '../../shared/application/ports/unit-of-work';
import { CONFIGURACION, type Configuracion } from '../../shared/infrastructure/config/configuracion';
import { CerrarSesion } from '../application/cerrar-sesion.use-case';
import { Login } from '../application/login.use-case';
import { OPCIONES_SESION, type OpcionesSesion } from '../application/ports/opciones-sesion';
import { PASSWORD_HASHER, type PasswordHasher } from '../application/ports/password-hasher';
import { SECRETOS_REFRESH, type SecretosRefresh } from '../application/ports/secretos-refresh';
import { TOKEN_ISSUER, type TokenIssuer } from '../application/ports/token-issuer';
import { RefrescarSesion } from '../application/refrescar-sesion.use-case';
import { AuthController } from './auth.controller';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';
import { CryptoSecretosRefresh } from './crypto-secretos-refresh';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenIssuer } from './jwt-token-issuer';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [CONFIGURACION],
      useFactory: (c: Configuracion) => ({ secret: c.jwtSecret, signOptions: { expiresIn: c.jwtAccessTtlSegundos } }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: PASSWORD_HASHER, useFactory: () => new BcryptPasswordHasher() },
    { provide: TOKEN_ISSUER, useClass: JwtTokenIssuer },
    { provide: SECRETOS_REFRESH, useFactory: () => new CryptoSecretosRefresh() },
    {
      provide: OPCIONES_SESION,
      inject: [CONFIGURACION],
      useFactory: (c: Configuracion): OpcionesSesion => ({ refreshTtlDias: c.refreshTtlDias }),
    },
    {
      provide: Login,
      inject: [UNIT_OF_WORK, PASSWORD_HASHER, TOKEN_ISSUER, SECRETOS_REFRESH, OPCIONES_SESION, CLOCK],
      useFactory: (u: UnitOfWork, h: PasswordHasher, t: TokenIssuer, s: SecretosRefresh, o: OpcionesSesion, c: Clock) =>
        new Login(u, h, t, s, o, c),
    },
    {
      provide: RefrescarSesion,
      inject: [UNIT_OF_WORK, TOKEN_ISSUER, SECRETOS_REFRESH, OPCIONES_SESION, CLOCK],
      useFactory: (u: UnitOfWork, t: TokenIssuer, s: SecretosRefresh, o: OpcionesSesion, c: Clock) =>
        new RefrescarSesion(u, t, s, o, c),
    },
    {
      provide: CerrarSesion,
      inject: [UNIT_OF_WORK, SECRETOS_REFRESH, CLOCK],
      useFactory: (u: UnitOfWork, s: SecretosRefresh, c: Clock) => new CerrarSesion(u, s, c),
    },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
