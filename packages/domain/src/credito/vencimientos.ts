import { sumarDias, sumarMeses } from '../fechas';
import { Periodicidad } from './periodicidad';

export function fechaVencimiento(fechaBase: string, periodicidad: Periodicidad, numero: number): string {
  switch (periodicidad) {
    case Periodicidad.ANUAL:
      return sumarMeses(fechaBase, 12 * numero);
    case Periodicidad.MENSUAL:
      return sumarMeses(fechaBase, numero);
    case Periodicidad.QUINCENAL: {
      const inicioDeMes = sumarMeses(fechaBase, Math.floor(numero / 2));
      return numero % 2 === 1 ? sumarDias(inicioDeMes, 15) : inicioDeMes;
    }
  }
}
