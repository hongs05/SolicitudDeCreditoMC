import { EstadoSolicitud } from '@credito/domain';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSolicitudes } from '../../shared/api/solicitudes';
import type { SolicitudResumen } from '../../shared/api/tipos';
import { formatearDinero, formatearInstante, textoPlazo } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { Card } from '../../shared/ui/Card';
import { Cargando } from '../../shared/ui/Cargando';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { Paginador } from '../../shared/ui/Paginador';
import { type Columna, Tabla } from '../../shared/ui/Tabla';

export function BandejaPage() {
  const { t, locale } = useT();
  const [page, setPage] = useState(1);
  const consulta = useSolicitudes({ estado: EstadoSolicitud.PENDIENTE, page });

  const columnas: Columna<SolicitudResumen>[] = [
    { clave: 'cedula', titulo: t('campo.cedula'), celda: (s) => s.cedula },
    { clave: 'nombre', titulo: t('campo.nombreCompleto'), celda: (s) => s.nombreCompleto },
    { clave: 'monto', titulo: t('campo.montoSolicitado'), celda: (s) => formatearDinero(s.montoSolicitado, locale), derecha: true },
    { clave: 'plazo', titulo: t('campo.plazo'), celda: (s) => textoPlazo(s.cantidadCuotas, s.periodicidad, t) },
    { clave: 'fecha', titulo: t('campo.fecha'), celda: (s) => formatearInstante(s.creadaEn, locale) },
    { clave: 'ver', titulo: '', celda: (s) => <Link to={`/comite/${s.id}`} className="text-teal-700 underline">{t('comun.ver')}</Link> },
  ];

  return (
    <Card titulo={t('comite.titulo')}>
      {consulta.isPending ? <Cargando /> : consulta.isError ? (
        <ErrorConsulta error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : (
        <>
          <Tabla columnas={columnas} filas={consulta.data?.items ?? []} claveFila={(s) => s.id} />
          {consulta.data && consulta.data.total > 0 && (
            <Paginador page={page} pageSize={consulta.data.pageSize} total={consulta.data.total} onCambiar={setPage} />
          )}
        </>
      )}
    </Card>
  );
}
