const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface PartesFecha {
  anio: number;
  mes: number;
  dia: number;
}

export function diasEnMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

export function esFechaValida(texto: string): boolean {
  const coincidencia = PATRON_FECHA.exec(texto);
  if (!coincidencia) return false;
  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasEnMes(anio, mes);
}

export function parsearFecha(texto: string): PartesFecha {
  if (!esFechaValida(texto)) {
    throw new RangeError(`Fecha inválida: ${texto}`);
  }
  const [anio, mes, dia] = texto.split('-').map(Number) as [number, number, number];
  return { anio, mes, dia };
}

export function formatearFecha(anio: number, mes: number, dia: number): string {
  return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function sumarMeses(fecha: string, meses: number): string {
  const { anio, mes, dia } = parsearFecha(fecha);
  const total = anio * 12 + (mes - 1) + meses;
  const nuevoAnio = Math.floor(total / 12);
  const nuevoMes = (total % 12) + 1;
  return formatearFecha(nuevoAnio, nuevoMes, Math.min(dia, diasEnMes(nuevoAnio, nuevoMes)));
}

export function sumarDias(fecha: string, dias: number): string {
  const { anio, mes, dia } = parsearFecha(fecha);
  const resultado = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return formatearFecha(
    resultado.getUTCFullYear(),
    resultado.getUTCMonth() + 1,
    resultado.getUTCDate(),
  );
}

export function fechaEnZona(instante: Date, zona: string): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instante);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}
