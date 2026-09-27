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
