import type { CookieOptions } from 'express';
import type { Configuracion } from '../../shared/infrastructure/config/configuracion';

export const NOMBRE_COOKIE_REFRESH = 'refresh_token';

export function opcionesCookie(config: Configuracion, expira?: Date): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.cookieSecure,
    path: '/api/v1/auth',
    ...(expira ? { expires: expira } : {}),
  };
}
