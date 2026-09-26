import type { CodigoMensaje } from './codigos';
import { LOCALE_POR_DEFECTO, type Locale } from './locale';
import { MENSAJES, VALORES_TRADUCIBLES } from './mensajes';

export function resolverMensaje(
  code: string,
  params: Record<string, unknown> = {},
  locale: Locale = LOCALE_POR_DEFECTO,
): string {
  const clave = code as CodigoMensaje;
  const plantilla =
    MENSAJES[locale][clave] ?? MENSAJES[LOCALE_POR_DEFECTO][clave] ?? MENSAJES[locale].ERROR_INTERNO;

  return plantilla.replace(/\{(\w+)\}/g, (original, nombre: string) => {
    if (!(nombre in params)) return original;
    const valor = String(params[nombre]);
    return VALORES_TRADUCIBLES[locale][nombre]?.[valor] ?? valor;
  });
}
