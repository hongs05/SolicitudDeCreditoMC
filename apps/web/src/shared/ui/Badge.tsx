import { EstadoSolicitud } from '@credito/domain';
import { useT } from '../i18n/I18nProvider';

const COLORES: Record<EstadoSolicitud, string> = {
  [EstadoSolicitud.PENDIENTE]: 'bg-pend-bg text-pend',
  [EstadoSolicitud.APROBADA]: 'bg-apro-bg text-apro',
  [EstadoSolicitud.RECHAZADA]: 'bg-rech-bg text-rech',
  [EstadoSolicitud.DESEMBOLSADA]: 'bg-desem-bg text-desem',
};

export function BadgeEstado({ estado }: { estado: EstadoSolicitud }) {
  const { t } = useT();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-2 align-middle text-xs font-semibold tracking-normal whitespace-nowrap ${COLORES[estado]}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {t(`estado.${estado}`)}
    </span>
  );
}
