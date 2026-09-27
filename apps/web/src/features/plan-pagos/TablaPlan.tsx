import { usePlanPagos } from '../../shared/api/creditos';
import type { CuotaResponse } from '../../shared/api/tipos';
import { formatearDinero, formatearFecha } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { Card } from '../../shared/ui/Card';
import { Cargando } from '../../shared/ui/Cargando';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { type Columna, Tabla } from '../../shared/ui/Tabla';

export function TablaPlan({ creditoId }: { creditoId: number }) {
  const { t, locale } = useT();
  const plan = usePlanPagos(creditoId);
  const dinero = (valor: string) => formatearDinero(valor, locale);

  const columnas: Columna<CuotaResponse>[] = [
    { clave: 'numero', titulo: t('plan.numero'), celda: (c) => c.numero },
    { clave: 'vencimiento', titulo: t('plan.vencimiento'), celda: (c) => formatearFecha(c.fechaVencimiento, locale) },
    { clave: 'cuota', titulo: t('plan.cuota'), celda: (c) => dinero(c.valorCuota), derecha: true },
    { clave: 'capital', titulo: t('plan.capital'), celda: (c) => dinero(c.capital), derecha: true },
    { clave: 'interes', titulo: t('plan.interes'), celda: (c) => dinero(c.interes), derecha: true },
    { clave: 'saldo', titulo: t('plan.saldo'), celda: (c) => dinero(c.saldoRestante), derecha: true },
  ];

  return (
    <Card titulo={t('plan.titulo')}>
      {plan.isPending ? <Cargando /> : plan.isError ? (
        <ErrorConsulta error={plan.error} onReintentar={() => void plan.refetch()} />
      ) : (
        <Tabla columnas={columnas} filas={plan.data?.cuotas ?? []} claveFila={(c) => c.numero} />
      )}
    </Card>
  );
}
