import { Rol } from '@credito/domain';
import type { ClaveTexto } from '../shared/i18n/es';

const TODOS = [Rol.OFICIAL, Rol.ANALISTA, Rol.CAJERO, Rol.ADMIN];

export const ENLACES: { ruta: string; clave: ClaveTexto; roles: Rol[] }[] = [
  { ruta: '/solicitudes', clave: 'nav.solicitudes', roles: TODOS },
  { ruta: '/solicitudes/nueva', clave: 'nav.nuevaSolicitud', roles: [Rol.OFICIAL] },
  { ruta: '/comite', clave: 'nav.comite', roles: [Rol.ANALISTA] },
  { ruta: '/desembolsos', clave: 'nav.desembolsos', roles: [Rol.CAJERO] },
  { ruta: '/plan-pagos', clave: 'nav.planPagos', roles: TODOS },
];

export const RUTA_INICIO: Record<Rol, string> = {
  [Rol.OFICIAL]: '/solicitudes',
  [Rol.ADMIN]: '/solicitudes',
  [Rol.ANALISTA]: '/comite',
  [Rol.CAJERO]: '/desembolsos',
};
