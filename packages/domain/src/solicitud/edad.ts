import { AntiguedadInconsistenteError, EdadMaximaExcedidaError, EdadMinimaNoAlcanzadaError } from '../errors/errores';
import { parsearFecha } from '../fechas';

export const EDAD_MAXIMA = 80;
export const EDAD_MINIMA = 18;
/** Edad mínima para trabajar en Nicaragua; limita la antigüedad laboral posible. */
export const EDAD_MINIMA_LABORAL = 14;

export function calcularEdad(fechaNacimiento: string, hoy: string): number {
  const nacimiento = parsearFecha(fechaNacimiento);
  const actual = parsearFecha(hoy);
  let edad = actual.anio - nacimiento.anio;
  const aunNoCumple =
    actual.mes < nacimiento.mes || (actual.mes === nacimiento.mes && actual.dia < nacimiento.dia);
  if (aunNoCumple) edad--;
  return edad;
}

/** Valida que el solicitante tenga entre 18 y 80 años y devuelve su edad. */
export function validarEdad(fechaNacimiento: string, hoy: string): number {
  const edad = calcularEdad(fechaNacimiento, hoy);
  if (edad < EDAD_MINIMA) throw new EdadMinimaNoAlcanzadaError(edad, EDAD_MINIMA);
  if (edad > EDAD_MAXIMA) throw new EdadMaximaExcedidaError(edad);
  return edad;
}

/** Años de antigüedad posibles para una edad: los trabajados desde la edad mínima laboral. */
export const antiguedadMaxima = (edad: number): number => Math.max(0, edad - EDAD_MINIMA_LABORAL);

export function validarAntiguedad(antiguedadAnios: number, edad: number): void {
  const max = antiguedadMaxima(edad);
  if (antiguedadAnios > max) throw new AntiguedadInconsistenteError(max, edad);
}
