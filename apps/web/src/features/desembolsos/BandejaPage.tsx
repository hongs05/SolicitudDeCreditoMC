import { EstadoSolicitud } from '@credito/domain';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCreditos } from '../../shared/api/creditos';
import type { CreditoResumen } from '../../shared/api/tipos';
import { formatearDinero, textoPlazo } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { Card } from '../../shared/ui/Card';
import { Cargando } from '../../shared/ui/Cargando';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { Paginador } from '../../shared/ui/Paginador';
import { type Columna, Tabla } from '../../shared/ui/Tabla';

export function BandejaPage() {
  const { t, locale } = useT();
  const [page, setPage] = useState(1);
  const consulta = useCreditos({ estado: EstadoSolicitud.APROBADA, page });

  const columnas: Columna<CreditoResumen>[] = [
    { clave: 'numero', titulo: t('campo.numeroCredito'), celda: (c) => c.numero },
    { clave: 'cedula', titulo: t('campo.cedula'), celda: (c) => c.cedula },
    { clave: 'nombre', titulo: t('campo.nombreCompleto'), celda: (c) => c.nombreCompleto },
    { clave: 'monto', titulo: t('campo.monto'), celda: (c) => formatearDinero(c.monto, locale), derecha: true },
    { clave: 'plazo', titulo: t('campo.plazo'), celda: (c) => textoPlazo(c.plazo, c.periodicidad, t) },
    { clave: 'ver', titulo: '', celda: (c) => <Link to={`/desembolsos/${c.id}`} className="text-teal-700 underline">{t('comun.ver')}</Link> },
  ];

  return (
    <Card titulo={t('desembolso.titulo')}>
      {consulta.isPending ? <Cargando /> : consulta.isError ? (
        <ErrorConsulta error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : (
        <>
          <Tabla columnas={columnas} filas={consulta.data?.items ?? []} claveFila={(c) => c.id} />
          {consulta.data && consulta.data.total > 0 && (
            <Paginador page={page} pageSize={consulta.data.pageSize} total={consulta.data.total} onCambiar={setPage} />
          )}
        </>
      )}
    </Card>
  );
}
