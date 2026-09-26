export enum Periodicidad {
  QUINCENAL = 'QUINCENAL',
  MENSUAL = 'MENSUAL',
  ANUAL = 'ANUAL',
}

export const PERIODOS_POR_ANIO: Record<Periodicidad, number> = {
  [Periodicidad.ANUAL]: 1,
  [Periodicidad.MENSUAL]: 12,
  [Periodicidad.QUINCENAL]: 24,
};

export function esPeriodicidad(valor: string): valor is Periodicidad {
  return (Object.values(Periodicidad) as string[]).includes(valor);
}
