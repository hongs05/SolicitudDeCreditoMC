import { EstadoSolicitud, Rol, tieneRol } from '@credito/domain';
import { type CSSProperties, type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type FiltrosSolicitudes, useConteoSolicitudes, useSolicitudes } from '../../shared/api/solicitudes';
import type { SolicitudResumen } from '../../shared/api/tipos';
import { formatearDinero, formatearInstante, formatearRelativo, numeroSolicitud, textoPlazo } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { BadgeEstado } from '../../shared/ui/Badge';
import { Button, claseBoton } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Campos';
import { Cargando } from '../../shared/ui/Cargando';
import { Encabezado } from '../../shared/ui/Encabezado';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { Icono } from '../../shared/ui/Icono';
import { Paginador } from '../../shared/ui/Paginador';
import { type Columna, Tabla } from '../../shared/ui/Tabla';
import { Vacio } from '../../shared/ui/Vacio';
import { useAuth } from '../auth/AuthProvider';

type Filtro = 'TODAS' | EstadoSolicitud;

const TARJETAS: { filtro: Filtro; color: string }[] = [
  { filtro: 'TODAS', color: 'var(--accent)' },
  { filtro: EstadoSolicitud.PENDIENTE, color: 'var(--pend)' },
  { filtro: EstadoSolicitud.APROBADA, color: 'var(--apro)' },
  { filtro: EstadoSolicitud.DESEMBOLSADA, color: 'var(--desem)' },
  { filtro: EstadoSolicitud.RECHAZADA, color: 'var(--rech)' },
];

function TarjetaEstado({ filtro, color, activa, onElegir }: { filtro: Filtro; color: string; activa: boolean; onElegir(): void }) {
  const { t } = useT();
  const conteo = useConteoSolicitudes(filtro === 'TODAS' ? undefined : filtro);
  return (
    <button type="button" aria-pressed={activa} onClick={onElegir} style={{ '--c': color } as CSSProperties}
      className={`relative grid gap-1 px-4 py-3.5 text-left text-ink transition-colors hover:bg-surface-2 after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:origin-left after:bg-[var(--c)] after:transition-transform after:duration-200 max-sm:first:col-span-2 ${activa ? 'bg-surface-2 after:scale-x-100' : 'bg-surface after:scale-x-0'}`}>
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <i aria-hidden="true" className="inline-block size-[7px] rounded-full" style={{ background: color }} />
        {t(`filtro.${filtro}`)}
      </span>
      <span className="text-[28px] leading-tight font-bold tracking-[-0.03em]">{conteo.data ?? '—'}</span>
    </button>
  );
}

export function ListadoPage() {
  const { t, locale } = useT();
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [filtros, setFiltros] = useState<FiltrosSolicitudes>({ page: 1 });
  const [cedula, setCedula] = useState('');
  const consulta = useSolicitudes(filtros);
  const filtroActivo: Filtro = filtros.estado ?? 'TODAS';

  const buscar = (evento: FormEvent) => {
    evento.preventDefault();
    setFiltros({ estado: filtros.estado, cedula: cedula.trim() || undefined, page: 1 });
  };
  const elegirEstado = (f: Filtro) => setFiltros({ estado: f === 'TODAS' ? undefined : f, cedula: filtros.cedula, page: 1 });
  const limpiar = () => { setCedula(''); setFiltros({ page: 1 }); };

  const columnas: Columna<SolicitudResumen>[] = [
    { clave: 'id', titulo: 'Nº', celda: (s) => <span className="font-mono text-[12.5px] text-muted">{numeroSolicitud(s.id)}</span>, secundaria: true },
    {
      clave: 'cliente', titulo: t('listado.cliente'), celda: (s) => (
        <div className="grid min-w-0 leading-snug">
          <Link to={`/solicitudes/${s.id}`} className="font-semibold text-ink hover:underline">{s.nombreCompleto}</Link>
          <span className="font-mono text-xs whitespace-nowrap text-muted">{s.cedula}</span>
        </div>
      ),
    },
    { clave: 'monto', titulo: t('campo.montoSolicitado'), celda: (s) => formatearDinero(s.montoSolicitado, locale), derecha: true, mono: true },
    { clave: 'plazo', titulo: t('campo.plazo'), celda: (s) => <span className="text-muted">{textoPlazo(s.cantidadCuotas, s.periodicidad, t)}</span>, secundaria: true },
    { clave: 'estado', titulo: t('campo.estado'), celda: (s) => <BadgeEstado estado={s.estado} /> },
    {
      clave: 'fecha', titulo: t('listado.registrada'), secundaria: true,
      celda: (s) => <span className="text-muted" title={formatearInstante(s.creadaEn, locale)}>{formatearRelativo(s.creadaEn, locale)}</span>,
    },
  ];

  const hayFiltros = Boolean(filtros.estado || filtros.cedula);

  return (
    <>
      <Encabezado
        titulo={t('nav.solicitudes')}
        subtitulo={t('listado.sub')}
        acciones={usuario && tieneRol(usuario.rol, [Rol.OFICIAL]) && (
          <Link to="/solicitudes/nueva" className={claseBoton()}><Icono nombre="mas" />{t('nav.nuevaSolicitud')}</Link>
        )}
      />
      <div role="group" aria-label={t('listado.filtrar')}
        className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
        {TARJETAS.map((c) => (
          <TarjetaEstado key={c.filtro} {...c} activa={filtroActivo === c.filtro} onElegir={() => elegirEstado(c.filtro)} />
        ))}
      </div>
      <section className="min-w-0 rounded-[14px] border border-line bg-surface">
        <form onSubmit={buscar} className="flex flex-wrap items-center gap-2.5 border-b border-line px-3.5 py-3">
          <div className="relative max-w-90 min-w-50 flex-1">
            <Icono nombre="buscar" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" />
            <label htmlFor="filtro-cedula" className="sr-only">{t('campo.cedula')}</label>
            <Input id="filtro-cedula" className="pl-8" placeholder={t('listado.buscarCedula')} value={cedula} onChange={(e) => setCedula(e.target.value)} />
          </div>
          <Button type="submit" variante="secundario" tamano="sm">{t('comun.buscar')}</Button>
          {consulta.data && (
            <span aria-live="polite" className="text-[13px] text-muted sm:ml-auto">{t('listado.cuenta', { n: consulta.data.total })}</span>
          )}
        </form>
        {consulta.isPending ? <Cargando /> : consulta.isError ? (
          <ErrorConsulta error={consulta.error} onReintentar={() => void consulta.refetch()} />
        ) : (
          <>
            <Tabla columnas={columnas} filas={consulta.data?.items ?? []} claveFila={(s) => s.id}
              onFila={(s) => navegar(`/solicitudes/${s.id}`)}
              vacio={(
                <Vacio icono={hayFiltros ? 'buscar' : 'bandeja'} titulo={t('comun.sinResultados')}
                  acciones={hayFiltros && <Button variante="secundario" tamano="sm" onClick={limpiar}>{t('listado.quitarFiltros')}</Button>}>
                  {hayFiltros && <p>{t('listado.vacioFiltro')}</p>}
                </Vacio>
              )} />
            {consulta.data && consulta.data.total > 0 && (
              <Paginador page={filtros.page} pageSize={consulta.data.pageSize} total={consulta.data.total}
                onCambiar={(page) => setFiltros({ ...filtros, page })} />
            )}
          </>
        )}
      </section>
    </>
  );
}
