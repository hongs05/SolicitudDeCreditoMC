import { EdadMaximaExcedidaError } from '../errors/errores';
import { parsearFecha } from '../fechas';

export const EDAD_MAXIMA = 80;

export function calcularEdad(fechaNacimiento: string, hoy: string): number {
  const nacimiento = parsearFecha(fechaNacimiento);
  const actual = parsearFecha(hoy);
  let edad = actual.anio - nacimiento.anio;
  const aunNoCumple =
    actual.mes < nacimiento.mes || (actual.mes === nacimiento.mes && actual.dia < nacimiento.dia);
  if (aunNoCumple) edad--;
  return edad;
}

export function validarEdadMaxima(fechaNacimiento: string, hoy: string): number {
  const edad = calcularEdad(fechaNacimiento, hoy);
  if (edad > EDAD_MAXIMA) throw new EdadMaximaExcedidaError(edad);
  return edad;
}
