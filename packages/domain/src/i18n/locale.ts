export type Locale = 'es' | 'en';

export const LOCALES: readonly Locale[] = ['es', 'en'];
export const LOCALE_POR_DEFECTO: Locale = 'es';

const esLocale = (valor: string): valor is Locale => (LOCALES as readonly string[]).includes(valor);

export function normalizarLocale(valor?: string | string[] | null): Locale {
  const texto = Array.isArray(valor) ? valor.join(',') : valor ?? '';
  for (const parte of texto.split(',')) {
    const primario = parte.split(';')[0]?.trim().toLowerCase().split('-')[0] ?? '';
    if (esLocale(primario)) return primario;
  }
  return LOCALE_POR_DEFECTO;
}
