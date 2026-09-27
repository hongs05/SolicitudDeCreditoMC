import { esPeriodicidad } from '@credito/domain';
import { formatearDinero, textoPlazo } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { RELACION_ALTA, type Resumen } from './resumen-solicitud';

export interface PanelCuotaProps {
  resumen: Resumen;
  periodicidad: string;
  cuotas: string;
  /** Avisos que no bloquean el envío, como una solicitud abierta con la misma cédula. */
  avisos?: string[];
}

function Fila({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono?: 'mal' | 'aviso' }) {
  const color = tono === 'mal' ? 'font-medium text-danger' : tono === 'aviso' ? 'font-medium text-pend' : '';
  return (
    <div className="flex justify-between gap-3 border-b border-dashed border-line py-2.5 text-[13px] last:border-b-0">
      <span className="text-muted">{etiqueta}</span>
      <span className={`text-right font-medium tabular-nums ${color}`}>{valor}</span>
    </div>
  );
}

export function PanelCuota({ resumen, periodicidad, cuotas, avisos = [] }: PanelCuotaProps) {
  const { t, locale } = useT();
  const { plan, relacion } = resumen;
  const per = esPeriodicidad(periodicidad) ? periodicidad : null;
  const relacionAlta = relacion !== null && relacion > RELACION_ALTA;
  const todosAvisos = [...avisos, ...(relacionAlta ? [t('panel.relacionAlta', { pct: relacion })] : [])];

  return (
    <section aria-label={t('panel.titulo')} className="overflow-hidden rounded-[14px] border border-line bg-surface">
      <div className="bg-band px-5 pt-5 pb-4.5">
        <span className="text-sm font-semibold text-accent-strong">{t('panel.cuota')}</span>
        <div className="mt-1.5 text-[34px] leading-tight font-bold tracking-[-0.035em] tabular-nums">
          {plan ? formatearDinero(plan.cuota, locale) : 'C$ —'}{' '}
          {per && <small className="text-[13px] font-medium tracking-normal text-muted">{t(`panel.por.${per}`)}</small>}
        </div>
      </div>
      <div className="px-5 pt-2 pb-3">
        <Fila etiqueta={t('campo.edad')} valor={resumen.edad === null ? '—' : t('comun.anios', { n: resumen.edad })} tono={resumen.edadExcedida ? 'mal' : undefined} />
        <Fila etiqueta={t('panel.plazo')} valor={plan && per ? textoPlazo(Number(cuotas), per, t) : '—'} />
        <Fila etiqueta={t('panel.total')} valor={plan ? formatearDinero(plan.totalPagar, locale) : '—'} />
        <Fila etiqueta={t('panel.intereses')} valor={plan ? formatearDinero(plan.totalIntereses, locale) : '—'} />
        <Fila etiqueta={t('panel.relacion')} valor={relacion === null ? '—' : `${relacion} %`} tono={relacionAlta ? 'aviso' : undefined} />
      </div>
      <div aria-live="polite" className="grid gap-2 px-5 empty:hidden [&>p]:mb-0 [&>p:last-child]:mb-4">
        {resumen.edadExcedida && <p className="rounded-[10px] bg-danger-soft px-3 py-2 text-[12.5px] font-medium text-danger">{t('panel.edadExcedida')}</p>}
        {!plan && <p className="rounded-[10px] bg-surface-2 px-3 py-2 text-[12.5px] text-muted">{t('panel.completar')}</p>}
        {todosAvisos.map((a) => <p key={a} className="rounded-[10px] bg-pend-bg px-3 py-2 text-[12.5px] text-pend">{a}</p>)}
      </div>
    </section>
  );
}
