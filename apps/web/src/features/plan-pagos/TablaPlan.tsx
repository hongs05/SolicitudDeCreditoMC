import { usePlanPagos } from '../../shared/api/creditos';
import type { CuotaResponse } from '../../shared/api/tipos';
import { formatearCifra, formatearDinero, formatearFecha, hoyNegocio } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { Cargando } from '../../shared/ui/Cargando';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { type Columna, Tabla } from '../../shared/ui/Tabla';
import { proximaCuota, totalesPlan } from './totales';

export function TablaPlan({ creditoId }: { creditoId: number }) {
  const { t, locale } = useT();
  const plan = usePlanPagos(creditoId);
  const cifra = (valor: string | number) => formatearCifra(valor, locale);
  const cuotas = plan.data?.cuotas ?? [];
  const proxima = proximaCuota(cuotas, hoyNegocio());
  const totales = totalesPlan(cuotas);

  const columnas: Columna<CuotaResponse>[] = [
    { clave: 'numero', titulo: t('plan.numero'), celda: (c) => <span className="font-medium text-accent">{c.numero}</span>, mono: true },
    { clave: 'vencimiento', titulo: t('plan.vencimiento'), celda: (c) => formatearFecha(c.fechaVencimiento, locale), mono: true },
    { clave: 'capital', titulo: t('plan.capital'), celda: (c) => cifra(c.capital), derecha: true, mono: true },
    { clave: 'interes', titulo: t('plan.interes'), celda: (c) => cifra(c.interes), derecha: true, mono: true },
    { clave: 'cuota', titulo: t('plan.cuota'), celda: (c) => cifra(c.valorCuota), derecha: true, mono: true },
    { clave: 'saldo', titulo: t('plan.saldo'), celda: (c) => cifra(c.saldoRestante), derecha: true, mono: true },
  ];

  const nota = cuotas[0] && [
    t('plan.nota', { cuota: formatearDinero(cuotas[0].valorCuota, locale) }),
    proxima ? t('plan.proxima', { fecha: formatearFecha(proxima.fechaVencimiento, locale) }) : '',
  ].filter(Boolean).join(' · ');

  return (
    <section className="relative min-w-0 overflow-hidden rounded-[14px] border border-line bg-surface">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(90deg,var(--accent)_0_18px,var(--maize)_18px_24px)]" />
      <div className="border-b border-dashed border-line-strong px-5 pt-5 pb-4">
        <h2 className="text-[15px] font-bold">
          {t('plan.titulo')}{plan.data && <span className="font-mono font-medium text-muted"> · {plan.data.credito.numero}</span>}
        </h2>
        {nota && <p className="text-[13px] text-muted">{nota}</p>}
      </div>
      {plan.isPending ? <Cargando /> : plan.isError ? (
        <ErrorConsulta error={plan.error} onReintentar={() => void plan.refetch()} />
      ) : (
        <div className="max-h-115 overflow-auto [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_tbody_tr:nth-child(even)]:bg-surface-2/55">
          <Tabla columnas={columnas} filas={cuotas} claveFila={(c) => c.numero}
            claseFila={(c) => (proxima && c.numero === proxima.numero ? '!bg-maize-soft shadow-[inset_3px_0_0_var(--maize)]' : '')}
            pie={(
              <tfoot>
                <tr className="border-t-2 border-ink bg-surface-2 font-mono text-[13px] font-semibold">
                  <td colSpan={2} className="px-3.5 py-2.5">{t('plan.totales')}</td>
                  <td className="px-3.5 py-2.5 text-right">{cifra(totales.capital)}</td>
                  <td className="px-3.5 py-2.5 text-right">{cifra(totales.interes)}</td>
                  <td className="px-3.5 py-2.5 text-right">{cifra(totales.valorCuota)}</td>
                  <td className="px-3.5 py-2.5 text-right">—</td>
                </tr>
              </tfoot>
            )} />
        </div>
      )}
    </section>
  );
}
