import { formatearDinero } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { Card } from '../../shared/ui/Card';
import { DatoLectura } from '../../shared/ui/DatoLectura';
import type { Resumen } from './resumen-solicitud';

export function PanelCuota({ resumen }: { resumen: Resumen }) {
  const { t, locale } = useT();
  return (
    <Card titulo={t('panel.titulo')}>
      <dl className="flex flex-col gap-3">
        <DatoLectura etiqueta={t('campo.edad')} valor={resumen.edad ?? '—'} />
        {resumen.plan ? (
          <>
            <DatoLectura etiqueta={t('panel.cuota')} valor={formatearDinero(resumen.plan.cuota, locale)} />
            <DatoLectura etiqueta={t('panel.total')} valor={formatearDinero(resumen.plan.totalPagar, locale)} />
            <DatoLectura etiqueta={t('panel.intereses')} valor={formatearDinero(resumen.plan.totalIntereses, locale)} />
          </>
        ) : (
          <p className="text-sm text-slate-500">{t('panel.completar')}</p>
        )}
      </dl>
      {resumen.edadExcedida && <p className="mt-4 text-sm font-medium text-red-700">{t('panel.edadExcedida')}</p>}
    </Card>
  );
}
