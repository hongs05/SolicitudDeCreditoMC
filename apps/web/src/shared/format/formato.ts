import { fechaEnZona, type Locale, parsearFecha, type Periodicidad } from '@credito/domain';
import type { Traductor } from '../i18n/I18nProvider';

export const MONEDA = { codigo: 'NIO', simbolo: 'C$' } as const;
export const ZONA_NEGOCIO = 'America/Managua';

const localeIntl = (locale: Locale) => (locale === 'es' ? 'es-NI' : 'en-US');

export const hoyNegocio = (): string => fechaEnZona(new Date(), ZONA_NEGOCIO);

export function formatearDinero(valor: number | string, locale: Locale): string {
  const numero = new Intl.NumberFormat(localeIntl(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor));
  return `${MONEDA.simbolo} ${numero}`;
}

export function formatearFecha(fecha: string, locale: Locale): string {
  const { anio, mes, dia } = parsearFecha(fecha);
  return new Intl.DateTimeFormat(localeIntl(locale), { dateStyle: 'medium', timeZone: 'UTC' })
    .format(new Date(Date.UTC(anio, mes - 1, dia)));
}

export function formatearInstante(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeIntl(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: ZONA_NEGOCIO,
  }).format(new Date(iso));
}

export function textoPlazo(cuotas: number, periodicidad: Periodicidad, t: Traductor): string {
  return cuotas === 1
    ? t('plazo.cuota', { n: cuotas, periodicidad: t(`plazo.singular.${periodicidad}`) })
    : t('plazo.cuotas', { n: cuotas, periodicidad: t(`plazo.plural.${periodicidad}`) });
}

export function formatearTasa(valor: number | string, locale: Locale): string {
  const numero = new Intl.NumberFormat(localeIntl(locale), { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(valor));
  return `${numero} %`;
}

/** `7` → `#0007`, como el diseño numera las solicitudes. */
export const numeroSolicitud = (id: number): string => `#${String(id).padStart(4, '0')}`;

const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400_000],
  ['month', 30 * 86_400_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

/** "hace 2 días" / "2 days ago". Menos de un minuto se muestra como "ahora". */
export function formatearRelativo(iso: string, locale: Locale, ahora: Date = new Date()): string {
  const diferencia = new Date(iso).getTime() - ahora.getTime();
  const rtf = new Intl.RelativeTimeFormat(localeIntl(locale), { numeric: 'auto' });
  for (const [unidad, ms] of UNIDADES) {
    if (Math.abs(diferencia) >= ms) return rtf.format(Math.round(diferencia / ms), unidad);
  }
  return rtf.format(0, 'second');
}

/** Días completos transcurridos desde un instante, para la columna "En espera" del comité. */
export const diasDesde = (iso: string, ahora: Date = new Date()): number =>
  Math.max(0, Math.floor((ahora.getTime() - new Date(iso).getTime()) / 86_400_000));

/** Importe sin símbolo, para columnas donde el encabezado ya indica la moneda. */
export const formatearCifra = (valor: number | string, locale: Locale): string =>
  new Intl.NumberFormat(localeIntl(locale), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(valor));
