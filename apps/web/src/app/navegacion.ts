import { Rol } from '@credito/domain';
import type { ClaveTexto } from '../shared/i18n/es';
import type { NombreIcono } from '../shared/ui/Icono';

const TODOS = [Rol.OFICIAL, Rol.ANALISTA, Rol.CAJERO, Rol.ADMIN];

export type Contador = 'comite' | 'desembolsos';

export interface Enlace {
  ruta: string;
  clave: ClaveTexto;
  roles: Rol[];
  icono: NombreIcono;
  grupo: ClaveTexto;
  /** Otras rutas que marcan este enlace como activo, por prefijo. */
  prefijos?: string[];
  contador?: Contador;
}

export const ENLACES: Enlace[] = [
  { ruta: '/solicitudes', clave: 'nav.todas', roles: TODOS, icono: 'lista', grupo: 'nav.grupoSolicitudes', prefijos: ['/solicitudes/'] },
  { ruta: '/solicitudes/nueva', clave: 'nav.nuevaSolicitud', roles: [Rol.OFICIAL], icono: 'mas', grupo: 'nav.grupoSolicitudes' },
  { ruta: '/comite', clave: 'nav.comite', roles: [Rol.ANALISTA], icono: 'mazo', grupo: 'nav.grupoOperacion', prefijos: ['/comite/'], contador: 'comite' },
  { ruta: '/desembolsos', clave: 'nav.desembolsos', roles: [Rol.CAJERO], icono: 'banco', grupo: 'nav.grupoOperacion', prefijos: ['/desembolsos/'], contador: 'desembolsos' },
  { ruta: '/plan-pagos', clave: 'nav.planPagos', roles: TODOS, icono: 'calendario', grupo: 'nav.grupoConsulta' },
];

export const RUTA_INICIO: Record<Rol, string> = {
  [Rol.OFICIAL]: '/solicitudes',
  [Rol.ADMIN]: '/solicitudes',
  [Rol.ANALISTA]: '/comite',
  [Rol.CAJERO]: '/desembolsos',
};

/** El enlace activo es el de coincidencia más específica, para que "Nueva solicitud" no encienda también "Todas". */
export function enlaceActivo(enlaces: Enlace[], ruta: string): string | undefined {
  const exacto = enlaces.find((e) => e.ruta === ruta);
  if (exacto) return exacto.ruta;
  return enlaces.find((e) => e.prefijos?.some((p) => ruta.startsWith(p)))?.ruta;
}
