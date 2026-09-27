import { EstadoSolicitud } from '@credito/domain';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSolicitudes } from '../../shared/api/solicitudes';
import type { SolicitudResumen } from '../../shared/api/tipos';
import { diasDesde, formatearDinero, formatearInstante, formatearRelativo, numeroSolicitud, textoPlazo } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { claseBoton } from '../../shared/ui/Button';
import { Cargando } from '../../shared/ui/Cargando';
import { Encabezado } from '../../shared/ui/Encabezado';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { Paginador } from '../../shared/ui/Paginador';
import { type Columna, Tabla } from '../../shared/ui/Tabla';
import { Vacio } from '../../shared/ui/Vacio';

/** Desde cuántos días de espera la etiqueta se marca como atrasada. */
const DIAS_ATRASO = 3;

export function BandejaPage() {
  const { t, locale } = useT();
  const navegar = useNavigate();
  const [page, setPage] = useState(1);
  // El comité atiende por orden de llegada: la API pagina de la más vieja a la más nueva.
  const consulta = useSolicitudes({ estado: EstadoSolicitud.PENDIENTE, orden: 'asc', page });
  // La más antigua de toda la bandeja, no solo de la página actual.
  const primera = useSolicitudes({ estado: EstadoSolicitud.PENDIENTE, orden: 'asc', page: 1, pageSize: 1 });
  const filas = consulta.data?.items ?? [];
  const total = consulta.data?.total ?? 0;
  const masAntigua = primera.data?.items[0];

  const espera = (iso: string) => {
    const dias = diasDesde(iso);
    const texto = dias === 0 ? t('comite.hoy') : dias === 1 ? t('comite.unDia') : t('comite.dias', { n: dias });
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${dias >= DIAS_ATRASO ? 'bg-rech-bg text-rech' : 'bg-surface-2 text-muted'}`}>{texto}</span>
    );
  };

  const columnas: Columna<SolicitudResumen>[] = [
    { clave: 'id', titulo: 'Nº', celda: (s) => <span className="font-mono text-[12.5px] text-muted">{numeroSolicitud(s.id)}</span>, secundaria: true },
    {
      clave: 'cliente', titulo: t('listado.cliente'), celda: (s) => (
        <div className="grid leading-snug">
          <Link to={`/comite/${s.id}`} className="font-semibold text-ink hover:underline">{s.nombreCompleto}</Link>
          <span className="font-mono text-xs whitespace-nowrap text-muted">{s.cedula}</span>
        </div>
      ),
    },
    { clave: 'monto', titulo: t('campo.montoSolicitado'), celda: (s) => formatearDinero(s.montoSolicitado, locale), derecha: true, mono: true },
    { clave: 'plazo', titulo: t('campo.plazo'), celda: (s) => <span className="text-muted">{textoPlazo(s.cantidadCuotas, s.periodicidad, t)}</span>, secundaria: true },
    { clave: 'espera', titulo: t('comite.enEspera'), celda: (s) => <span title={formatearInstante(s.creadaEn, locale)}>{espera(s.creadaEn)}</span>, secundaria: true },
    { clave: 'ir', titulo: '', derecha: true, secundaria: true, celda: (s) => <Link to={`/comite/${s.id}`} className={claseBoton('secundario', 'sm')}>{t('detalle.dictaminar')}</Link> },
  ];

  const subtitulo = !masAntigua ? t('comite.subVacio')
    : total === 1 ? t('comite.subUna', { cuando: formatearRelativo(masAntigua.creadaEn, locale) })
      : t('comite.sub', { n: total, cuando: formatearRelativo(masAntigua.creadaEn, locale) });

  return (
    <>
      <Encabezado titulo={t('comite.titulo')} subtitulo={subtitulo} />
      <section className="min-w-0 rounded-[14px] border border-line bg-surface">
        {consulta.isPending ? <Cargando /> : consulta.isError ? (
          <ErrorConsulta error={consulta.error} onReintentar={() => void consulta.refetch()} />
        ) : (
          <>
            <Tabla columnas={columnas} filas={filas} claveFila={(s) => s.id} onFila={(s) => navegar(`/comite/${s.id}`)}
              vacio={<Vacio icono="check" titulo={t('comite.vacioTitulo')}><p>{t('comite.vacioTexto')}</p></Vacio>} />
            {total > 0 && consulta.data && (
              <Paginador page={page} pageSize={consulta.data.pageSize} total={total} onCambiar={setPage} />
            )}
          </>
        )}
      </section>
    </>
  );
}
