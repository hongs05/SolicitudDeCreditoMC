import { EstadoSolicitud } from '@credito/domain';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreditos } from '../../shared/api/creditos';
import type { CreditoResumen } from '../../shared/api/tipos';
import { formatearDinero, textoPlazo } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { claseBoton } from '../../shared/ui/Button';
import { Cargando } from '../../shared/ui/Cargando';
import { Encabezado } from '../../shared/ui/Encabezado';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { Paginador } from '../../shared/ui/Paginador';
import { type Columna, Tabla } from '../../shared/ui/Tabla';
import { Vacio } from '../../shared/ui/Vacio';
import { sumarMontos } from './resumen';

export function BandejaPage() {
  const { t, locale } = useT();
  const navegar = useNavigate();
  const [page, setPage] = useState(1);
  const consulta = useCreditos({ estado: EstadoSolicitud.APROBADA, page });
  const items = consulta.data?.items ?? [];
  const total = consulta.data?.total ?? 0;

  const columnas: Columna<CreditoResumen>[] = [
    { clave: 'numero', titulo: t('campo.numeroCredito'), celda: (c) => <span className="font-mono text-[12.5px] text-muted">{c.numero}</span>, secundaria: true },
    {
      clave: 'cliente', titulo: t('listado.cliente'), celda: (c) => (
        <div className="grid leading-snug">
          <Link to={`/desembolsos/${c.id}`} className="font-semibold text-ink hover:underline">{c.nombreCompleto}</Link>
          <span className="font-mono text-xs whitespace-nowrap text-muted">{c.cedula}</span>
        </div>
      ),
    },
    { clave: 'monto', titulo: t('campo.monto'), celda: (c) => formatearDinero(c.monto, locale), derecha: true, mono: true },
    { clave: 'plazo', titulo: t('campo.plazo'), celda: (c) => <span className="text-muted">{textoPlazo(c.plazo, c.periodicidad, t)}</span>, secundaria: true },
    { clave: 'ir', titulo: '', derecha: true, secundaria: true, celda: (c) => <Link to={`/desembolsos/${c.id}`} className={claseBoton('secundario', 'sm')}>{t('detalle.desembolsar')}</Link> },
  ];

  // El total en córdobas solo es exacto si todos los créditos caben en esta página.
  const subtitulo = total === 0 ? t('desembolso.subVacio')
    : [
        total === 1 ? t('desembolso.subUno') : t('desembolso.sub', { n: total }),
        items.length === total ? t('desembolso.subTotal', { total: formatearDinero(sumarMontos(items), locale) }) : '',
      ].filter(Boolean).join(' ');

  return (
    <>
      <Encabezado titulo={t('desembolso.titulo')} subtitulo={consulta.data ? subtitulo : undefined} />
      <section className="min-w-0 rounded-[14px] border border-line bg-surface">
        {consulta.isPending ? <Cargando /> : consulta.isError ? (
          <ErrorConsulta error={consulta.error} onReintentar={() => void consulta.refetch()} />
        ) : (
          <>
            <Tabla columnas={columnas} filas={items} claveFila={(c) => c.id} onFila={(c) => navegar(`/desembolsos/${c.id}`)}
              vacio={<Vacio icono="check" titulo={t('desembolso.vacioTitulo')}><p>{t('desembolso.vacioTexto')}</p></Vacio>} />
            {total > 0 && consulta.data && (
              <Paginador page={page} pageSize={consulta.data.pageSize} total={total} onCambiar={setPage} />
            )}
          </>
        )}
      </section>
    </>
  );
}
