import {
  calcularEdad, EDAD_MAXIMA, esFechaValida, esPeriodicidad, type Locale, resolverMensaje,
} from '@credito/domain';
import { z } from 'zod';

export const PATRON_DECIMAL = /^\d+(\.\d{1,2})?$/;

export function crearEsquemaSolicitud(hoy: string, locale: Locale) {
  const m = (code: string, params?: Record<string, unknown>) => resolverMensaje(code, params, locale);
  const requerido = () => z.string().trim().min(1, m('REQUERIDO'));
  const texto = (min: number, max: number) =>
    requerido().min(min, m('LONGITUD_INVALIDA', { min, max })).max(max, m('LONGITUD_INVALIDA', { min, max }));
  const entero = (min: number, max: number) =>
    requerido()
      .regex(/^\d+$/, m('ENTERO_REQUERIDO'))
      .refine((v) => Number(v) >= min, m('VALOR_MINIMO', { min }))
      .refine((v) => Number(v) <= max, m('VALOR_MAXIMO', { max }));
  const decimal = () => requerido().regex(PATRON_DECIMAL, m('FORMATO_INVALIDO'));

  return z.object({
    nombreCompleto: texto(3, 120),
    cedula: texto(5, 30).regex(/^\S+$/, m('FORMATO_INVALIDO')),
    correo: requerido().email(m('CORREO_INVALIDO')),
    telefono: texto(7, 20),
    fechaNacimiento: requerido()
      .refine((v) => esFechaValida(v) && v < hoy, m('FECHA_INVALIDA'))
      .refine(
        (v) => !esFechaValida(v) || v >= hoy || calcularEdad(v, hoy) <= EDAD_MAXIMA,
        (v) => ({ message: m('EDAD_MAXIMA_EXCEDIDA', { edad: esFechaValida(v) ? calcularEdad(v, hoy) : 0 }) }),
      ),
    tipoEmpleoId: requerido(),
    empresa: texto(2, 120),
    antiguedadAnios: entero(0, 60),
    ingresoMensual: decimal().refine((v) => Number(v) >= 0.01, m('VALOR_MINIMO', { min: 0.01 })),
    montoSolicitado: decimal().refine((v) => Number(v) >= 0.01, m('VALOR_MINIMO', { min: 0.01 })),
    cantidadCuotas: entero(1, 360),
    tasaAnual: decimal().refine((v) => Number(v) <= 100, m('VALOR_MAXIMO', { max: 100 })),
    periodicidad: z.string().refine(esPeriodicidad, m('REQUERIDO')),
  });
}

export type ValoresSolicitud = z.input<ReturnType<typeof crearEsquemaSolicitud>>;

export const VALORES_INICIALES: ValoresSolicitud = {
  nombreCompleto: '',
  cedula: '',
  correo: '',
  telefono: '',
  fechaNacimiento: '',
  tipoEmpleoId: '',
  empresa: '',
  antiguedadAnios: '',
  ingresoMensual: '',
  montoSolicitado: '',
  cantidadCuotas: '',
  tasaAnual: '',
  periodicidad: '',
};

const dosDecimales = (v: string) => Number(v).toFixed(2);

export const aCuerpoSolicitud = (v: ValoresSolicitud): Record<string, unknown> => ({
  nombreCompleto: v.nombreCompleto.trim(),
  cedula: v.cedula.trim(),
  correo: v.correo.trim(),
  telefono: v.telefono.trim(),
  fechaNacimiento: v.fechaNacimiento,
  tipoEmpleoId: Number(v.tipoEmpleoId),
  empresa: v.empresa.trim(),
  antiguedadAnios: Number(v.antiguedadAnios),
  ingresoMensual: dosDecimales(v.ingresoMensual),
  montoSolicitado: dosDecimales(v.montoSolicitado),
  cantidadCuotas: Number(v.cantidadCuotas),
  tasaAnual: dosDecimales(v.tasaAnual),
  periodicidad: v.periodicidad,
});
