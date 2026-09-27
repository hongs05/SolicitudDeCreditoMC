import { EstadoSolicitud, esPeriodicidad, Rol, tieneRol } from '@credito/domain';
import { Link, useParams } from 'react-router-dom';
import { useCredito } from '../../shared/api/creditos';
import { useSolicitud } from '../../shared/api/solicitudes';
import {
  formatearDinero, formatearFecha, formatearInstante, formatearRelativo, formatearTasa, numeroSolicitud, textoPlazo,
} from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { BadgeEstado } from '../../shared/ui/Badge';
import { claseBoton } from '../../shared/ui/Button';
import { Cargando } from '../../shared/ui/Cargando';
import { DatoLectura, GrupoDatos } from '../../shared/ui/DatoLectura';
import { Encabezado } from '../../shared/ui/Encabezado';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { Icono } from '../../shared/ui/Icono';
import { useAuth } from '../auth/AuthProvider';
import { relacionCuotaIngreso } from './resumen-solicitud';

interface Evento {
  hecho: boolean;
  rechazo?: boolean;
  titulo: string;
  detalle: string;
  observaciones?: string | null;
  cuando?: string | null;
}

function Historial({ eventos }: { eventos: Evento[] }) {
  const { locale } = useT();
  return (
    <ol className="grid">
      {eventos.map((e, i) => (
        <li key={i} className="relative grid grid-cols-[20px_1fr_auto] items-start gap-3 pb-3.5 last:pb-0">
          {i < eventos.length - 1 && (
            <span aria-hidden="true" className={`absolute top-[18px] -bottom-0.5 left-[9px] w-0.5 ${e.hecho && !e.rechazo ? 'bg-accent' : 'bg-line'}`} />
          )}
          <span aria-hidden="true"
            className={`relative z-10 grid size-5 place-items-center rounded-full border-2 ${e.rechazo ? 'border-rech bg-rech' : e.hecho ? 'border-accent bg-accent' : 'border-line-strong bg-surface'}`}>
            {e.hecho && <span className="size-[5px] rounded-full bg-on-accent" />}
          </span>
          <div className="min-w-0">
            <strong className="block font-semibold">{e.titulo}</strong>
            <small className="block text-[12.5px] text-muted">{e.detalle}</small>
            {e.observaciones && <p className="mt-1.5 rounded-[10px] bg-maize-soft px-2.5 py-2 text-[12.5px] [overflow-wrap:anywhere]">{e.observaciones}</p>}
          </div>
          <span className="font-mono text-[11.5px] whitespace-nowrap text-faint">{e.cuando ? formatearInstante(e.cuando, locale) : ''}</span>
        </li>
      ))}
    </ol>
  );
}

export function DetallePage() {
  const { t, locale } = useT();
  const { usuario } = useAuth();
  const id = Number(useParams().solicitudId);
  const consulta = useSolicitud(id);
  const credito = useCredito(consulta.data?.creditoId ?? null);

  if (consulta.isPending) return <Cargando />;
  if (consulta.isError) return <ErrorConsulta error={consulta.error} onReintentar={() => void consulta.refetch()} />;
  const s = consulta.data;
  const c = credito.data;
  const d = c?.desembolso ?? null;
  const puede = (roles: Rol[]) => Boolean(usuario && tieneRol(usuario.rol, roles));
  const plazo = textoPlazo(s.cantidadCuotas, s.periodicidad, t);
  const cuota = Number(s.cuotaNivelada);
  const relacion = esPeriodicidad(s.periodicidad) ? relacionCuotaIngreso(cuota, s.periodicidad, Number(s.ingresoMensual)) : null;
  const rechazada = s.estado === EstadoSolicitud.RECHAZADA;
  const por = (u?: { username: string } | null) => (u ? t('detalle.por', { usuario: u.username }) : '');

  const eventos: Evento[] = [
    { hecho: true, titulo: t('detalle.registrada'), detalle: plazo, cuando: s.creadaEn },
    s.estado === EstadoSolicitud.PENDIENTE
      ? { hecho: false, titulo: t('detalle.esperaComite'), detalle: t('detalle.esperaComiteSub') }
      : {
          hecho: true, rechazo: rechazada,
          titulo: t(rechazada ? 'detalle.rechazada' : 'detalle.aprobada'),
          detalle: [por(s.dictaminadaPor), c ? t('detalle.credito', { numero: c.numero }) : ''].filter(Boolean).join(' · '),
          observaciones: s.observaciones, cuando: s.dictaminadaEn,
        },
  ];
  if (!rechazada) {
    eventos.push(d
      ? { hecho: true, titulo: t('detalle.desembolsada'), detalle: [por(d.ejecutadoPor), d.banco.nombre, t('detalle.cuenta', { ultimos: d.numeroCuenta.slice(-4) })].filter(Boolean).join(' · '), cuando: d.ejecutadoEn }
      : { hecho: false, titulo: t('detalle.desembolso'), detalle: t(s.estado === EstadoSolicitud.APROBADA ? 'detalle.pendienteCaja' : 'detalle.alAprobar') });
  }

  const acciones = (
    <>
      {s.estado === EstadoSolicitud.PENDIENTE && puede([Rol.ANALISTA]) && (
        <Link to={`/comite/${s.id}`} className={claseBoton()}><Icono nombre="mazo" />{t('detalle.dictaminar')}</Link>
      )}
      {s.estado === EstadoSolicitud.APROBADA && s.creditoId !== null && puede([Rol.CAJERO]) && (
        <Link to={`/desembolsos/${s.creditoId}`} className={claseBoton()}><Icono nombre="banco" />{t('detalle.desembolsar')}</Link>
      )}
      {s.creditoId !== null && (
        <Link to={`/plan-pagos?cedula=${encodeURIComponent(s.cedula)}&credito=${s.creditoId}`} className={claseBoton('secundario')}>
          <Icono nombre="calendario" />{t('nav.planPagos')}
        </Link>
      )}
    </>
  );

  return (
    <>
      <Encabezado
        migas={[{ texto: t('nav.solicitudes'), a: '/solicitudes' }, { texto: numeroSolicitud(s.id) }]}
        titulo={<>{s.nombreCompleto} <BadgeEstado estado={s.estado} /></>}
        subtitulo={t('detalle.sub', { numero: numeroSolicitud(s.id), cuando: formatearRelativo(s.creadaEn, locale) })}
        acciones={acciones}
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-4">
          <section className="grid rounded-[14px] border border-line bg-surface md:grid-cols-2 md:divide-x md:divide-line max-md:divide-y max-md:divide-line">
            <GrupoDatos titulo={t('detalle.personal')}>
              <DatoLectura etiqueta={t('campo.cedula')} valor={s.cedula} mono />
              <DatoLectura etiqueta={t('detalle.nacimiento')} valor={formatearFecha(s.fechaNacimiento, locale)} />
              <DatoLectura etiqueta={t('campo.edad')} valor={t('comun.anios', { n: s.edad })} />
              <DatoLectura etiqueta={t('campo.correo')} valor={s.correo} />
              <DatoLectura etiqueta={t('campo.telefono')} valor={s.telefono} mono />
            </GrupoDatos>
            <GrupoDatos titulo={t('detalle.laboral')}>
              <DatoLectura etiqueta={t('campo.tipoEmpleo')} valor={s.tipoEmpleo.nombre} />
              <DatoLectura etiqueta={t('campo.empresa')} valor={s.empresa} />
              <DatoLectura etiqueta={t('campo.antiguedadAnios')} valor={t(s.antiguedadAnios === 1 ? 'comun.anio' : 'comun.anios', { n: s.antiguedadAnios })} />
              <DatoLectura etiqueta={t('campo.ingresoMensual')} valor={formatearDinero(s.ingresoMensual, locale)} mono />
            </GrupoDatos>
          </section>
          <section className="rounded-[14px] border border-line bg-surface">
            <h2 className="border-b border-line px-5 py-4 text-[15px] font-bold">{t('detalle.historial')}</h2>
            <div className="p-5"><Historial eventos={eventos} /></div>
          </section>
        </div>
        <aside className="overflow-hidden rounded-[14px] border border-line bg-surface xl:sticky xl:top-6">
          <div className="bg-band px-5 pt-5 pb-4.5">
            <span className="text-[11px] font-semibold tracking-[0.1em] text-accent-strong uppercase">{t('panel.cuota')}</span>
            <div className="mt-1.5 text-[34px] leading-tight font-bold tracking-[-0.035em] tabular-nums">
              {formatearDinero(cuota, locale)} <small className="text-[13px] font-medium tracking-normal text-muted">{t(`panel.por.${s.periodicidad}`)}</small>
            </div>
          </div>
          <dl className="grid gap-2.5 px-5 py-4">
            <DatoLectura etiqueta={t('campo.montoSolicitado')} valor={formatearDinero(s.montoSolicitado, locale)} mono />
            <DatoLectura etiqueta={t('campo.tasa')} valor={formatearTasa(s.tasaAnual, locale)} mono />
            <DatoLectura etiqueta={t('campo.plazo')} valor={plazo} />
            <DatoLectura etiqueta={t('detalle.relacion')} valor={relacion === null ? '—' : `${relacion} %`} mono />
            {c && <DatoLectura etiqueta={t('campo.numeroCredito')} valor={c.numero} mono />}
          </dl>
        </aside>
      </div>
    </>
  );
}
