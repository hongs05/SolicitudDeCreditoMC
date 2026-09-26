export interface Configuracion {
  databaseUrl: string;
  jwtSecret: string;
  jwtAccessTtlSegundos: number;
  refreshTtlDias: number;
  cookieSecure: boolean;
  zonaHoraria: string;
  puerto: number;
}

export const CONFIGURACION = Symbol('Configuracion');

const SEGUNDOS_POR_UNIDAD: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

function duracionEnSegundos(texto: string): number | null {
  const coincidencia = /^(\d+)([smhd])$/.exec(texto);
  if (!coincidencia) return null;
  const valor = Number(coincidencia[1]) * SEGUNDOS_POR_UNIDAD[coincidencia[2]!]!;
  return valor > 0 ? valor : null;
}

function esZonaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

export function cargarConfiguracion(env: Record<string, string | undefined>): Configuracion {
  const errores: string[] = [];

  const databaseUrl = env.DATABASE_URL ?? '';
  if (!databaseUrl) errores.push('DATABASE_URL es obligatoria');

  const jwtSecret = env.JWT_SECRET ?? '';
  if (!jwtSecret) errores.push('JWT_SECRET es obligatorio');
  else if (jwtSecret.length < 32) errores.push('JWT_SECRET debe tener al menos 32 caracteres');

  const ttlTexto = env.JWT_ACCESS_TTL ?? '15m';
  const jwtAccessTtlSegundos = duracionEnSegundos(ttlTexto);
  if (jwtAccessTtlSegundos === null) {
    errores.push('JWT_ACCESS_TTL debe tener el formato <número><s|m|h|d>, mayor que cero');
  }

  const refreshTtlDias = Number(env.REFRESH_TTL_DAYS ?? '7');
  if (!Number.isInteger(refreshTtlDias) || refreshTtlDias <= 0) {
    errores.push('REFRESH_TTL_DAYS debe ser un entero positivo');
  }

  const cookieTexto = env.COOKIE_SECURE ?? 'false';
  if (cookieTexto !== 'true' && cookieTexto !== 'false') {
    errores.push('COOKIE_SECURE debe ser true o false');
  }

  const zonaHoraria = env.APP_TZ ?? 'America/Managua';
  if (!esZonaValida(zonaHoraria)) errores.push('APP_TZ debe ser una zona horaria IANA válida');

  const puerto = Number(env.PORT ?? '3000');
  if (!Number.isInteger(puerto) || puerto <= 0 || puerto > 65535) {
    errores.push('PORT debe ser un entero entre 1 y 65535');
  }

  if (errores.length > 0) {
    throw new Error(`Configuración inválida:\n- ${errores.join('\n- ')}`);
  }

  return {
    databaseUrl,
    jwtSecret,
    jwtAccessTtlSegundos: jwtAccessTtlSegundos!,
    refreshTtlDias,
    cookieSecure: cookieTexto === 'true',
    zonaHoraria,
    puerto,
  };
}
