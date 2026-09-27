import { EstadoSolicitud } from '@credito/domain';
import { useT } from '../i18n/I18nProvider';

const COLORES: Record<EstadoSolicitud, string> = {
  [EstadoSolicitud.PENDIENTE]: 'bg-amber-100 text-amber-900',
  [EstadoSolicitud.APROBADA]: 'bg-teal-100 text-teal-900',
  [EstadoSolicitud.RECHAZADA]: 'bg-red-100 text-red-900',
  [EstadoSolicitud.DESEMBOLSADA]: 'bg-slate-200 text-slate-900',
};

export function BadgeEstado({ estado }: { estado: EstadoSolicitud }) {
  const { t } = useT();
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORES[estado]}`}>
      {t(`estado.${estado}`)}
    </span>
  );
}
