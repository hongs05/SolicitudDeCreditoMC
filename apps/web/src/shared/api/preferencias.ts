import { type Locale, normalizarLocale } from '@credito/domain';

const CLAVE = 'locale';

function leerGuardado(): Locale {
  try {
    return normalizarLocale(localStorage.getItem(CLAVE));
  } catch {
    return 'es';
  }
}

let actual: Locale = leerGuardado();

export const preferencias = {
  locale: (): Locale => actual,
  fijarLocale(locale: Locale): void {
    actual = locale;
    try {
      localStorage.setItem(CLAVE, locale);
    } catch {
      // Sin almacenamiento disponible, el idioma dura solo esta sesión.
    }
  },
};
