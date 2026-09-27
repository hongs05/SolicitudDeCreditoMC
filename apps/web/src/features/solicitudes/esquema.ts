import {
  antiguedadMaxima, calcularEdad, EDAD_MAXIMA, EDAD_MINIMA, esFechaValida, esPeriodicidad, type Locale,
  PATRON_NOMBRE, PATRON_TELEFONO, PERIODOS_POR_ANIO, PLAZO_MAXIMO_ANIOS, resolverMensaje,
} from '@credito/domain';
import { z } from 'zod';

export const PATRON_DECIMAL = /^\d{1,12}(\.\d{1,2})?$/;

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

  const base = z.object({
    nombreCompleto: texto(3, 120).regex(PATRON_NOMBRE, m('FORMATO_INVALIDO')),
    cedula: texto(5, 30).regex(/^\S+$/, m('FORMATO_INVALIDO')),
    correo: requerido().email(m('CORREO_INVALIDO')),
    telefono: texto(7, 20).regex(PATRON_TELEFONO, m('FORMATO_INVALIDO')),
    fechaNacimiento: requerido()
      .refine((v) => esFechaValida(v) && v < hoy, m('FECHA_INVALIDA'))
      .refine(
        (v) => !esFechaValida(v) || v >= hoy || calcularEdad(v, hoy) <= EDAD_MAXIMA,
        (v) => ({ message: m('EDAD_MAXIMA_EXCEDIDA', { edad: esFechaValida(v) ? calcularEdad(v, hoy) : 0 }) }),
      )
      .refine(
        (v) => !esFechaValida(v) || v >= hoy || calcularEdad(v, hoy) >= EDAD_MINIMA,
        (v) => ({ message: m('EDAD_MINIMA_NO_ALCANZADA', { edad: esFechaValida(v) ? calcularEdad(v, hoy) : 0, min: EDAD_MINIMA }) }),
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

  // Reglas entre campos. Van aparte, en una intersección, para que se evalúen aunque otros campos
  // todavía tengan errores (el superRefine de un objeto de zod solo corre si todo el objeto es válido).
  const cruzadas = z.object({
    fechaNacimiento: z.string(),
    antiguedadAnios: z.string(),
    cantidadCuotas: z.string(),
    periodicidad: z.string(),
  }).superRefine((v, ctx) => {
    const antiguedad = Number(v.antiguedadAnios);
    if (esFechaValida(v.fechaNacimiento) && v.fechaNacimiento < hoy && /^\d+$/.test(v.antiguedadAnios)) {
      const edad = calcularEdad(v.fechaNacimiento, hoy);
      const max = antiguedadMaxima(edad);
      if (antiguedad > max) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['antiguedadAnios'], message: m('ANTIGUEDAD_INCONSISTENTE', { max, edad }) });
      }
    }
    if (esPeriodicidad(v.periodicidad) && /^\d+$/.test(v.cantidadCuotas)
      && Number(v.cantidadCuotas) / PERIODOS_POR_ANIO[v.periodicidad] > PLAZO_MAXIMO_ANIOS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cantidadCuotas'], message: m('PLAZO_MAXIMO_EXCEDIDO', { max: PLAZO_MAXIMO_ANIOS }) });
    }
  });

  return z.intersection(base, cruzadas);
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
  periodicidad: 'MENSUAL',
};

/** Datos de ejemplo para el botón "Llenar con ejemplo"; el tipo de empleo se toma del catálogo al usarlos. */
export const VALORES_EJEMPLO: Omit<ValoresSolicitud, 'tipoEmpleoId'> = {
  nombreCompleto: 'Mariela Esperanza Guevara Ortiz',
  cedula: '001-140689-0045R',
  correo: 'mguevara@correo.com.ni',
  telefono: '87624410',
  fechaNacimiento: '1989-06-14',
  empresa: 'Farmacia Santa Ana',
  antiguedadAnios: '5',
  ingresoMensual: '27500',
  montoSolicitado: '45000',
  cantidadCuotas: '24',
  tasaAnual: '18',
  periodicidad: 'MENSUAL',
};

const dosDecimales = (v: string): string => {
  const [entero, fraccion = ''] = v.split('.');
  return `${entero}.${fraccion.padEnd(2, '0').slice(0, 2)}`;
};

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
