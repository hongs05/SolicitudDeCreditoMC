import { puedeEjecutar, resolverMensaje } from '@credito/domain';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSolicitud } from '../../shared/api/solicitudes';
import { formatearDinero, formatearRelativo, numeroSolicitud, textoPlazo } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { avisarError } from '../../shared/ui/avisarError';
import { BadgeEstado } from '../../shared/ui/Badge';
import { Button, claseBoton } from '../../shared/ui/Button';
import { Field, TextArea } from '../../shared/ui/Campos';
import { Cargando } from '../../shared/ui/Cargando';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { DatoLectura, GrupoDatos } from '../../shared/ui/DatoLectura';
import { Encabezado } from '../../shared/ui/Encabezado';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { useToast } from '../../shared/ui/Toast';
import { type AccionDictamen, useDictaminar } from './api';

const MAX_OBSERVACIONES = 1000;

export function DictamenPage() {
  const { t, locale } = useT();
  const toast = useToast();
  const navegar = useNavigate();
  const id = Number(useParams().solicitudId);
  const consulta = useSolicitud(id);
  const dictaminar = useDictaminar(id);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [pendiente, setPendiente] = useState<AccionDictamen | null>(null);
  const enviando = useRef(false);

  if (consulta.isPending) return <Cargando />;
  if (consulta.isError) return <ErrorConsulta error={consulta.error} onReintentar={() => void consulta.refetch()} />;
  const s = consulta.data;
  const activa = puedeEjecutar(s.estado, 'aprobar');
  const hayObservaciones = observaciones.trim().length > 0;
  const plazo = textoPlazo(s.cantidadCuotas, s.periodicidad, t);

  const pedir = (accion: AccionDictamen) => {
    if (!hayObservaciones) {
      setError(resolverMensaje('OBSERVACIONES_REQUERIDAS', {}, locale));
      return;
    }
    setError(undefined);
    setPendiente(accion);
  };

  const confirmar = async () => {
    if (!pendiente || enviando.current) return;
    enviando.current = true;
    try {
      const r = await dictaminar.mutateAsync({ accion: pendiente, observaciones: observaciones.trim() });
      if (r.credito) toast.exito(t('comite.aprobada', { numero: r.credito.numero }), { detalle: `${s.nombreCompleto} · ${plazo}` });
      else toast.info(t('comite.rechazada', { id: numeroSolicitud(id) }), { detalle: t('comite.rechazadaDetalle') });
      navegar('/comite');
    } catch (e) {
      const accion = pendiente;
      setPendiente(null);
      avisarError(toast, e, { generico: t('comun.errorGenerico'), reintentar: t('comun.reintentar') }, () => setPendiente(accion));
    } finally {
      enviando.current = false;
    }
  };

  const esRechazo = pendiente === 'rechazar';

  return (
    <>
      <Encabezado
        migas={[{ texto: t('nav.comite'), a: '/comite' }, { texto: numeroSolicitud(s.id) }]}
        titulo={<>{t('comite.dictamen', { id: numeroSolicitud(id) })} <BadgeEstado estado={s.estado} /></>}
        subtitulo={activa ? t('comite.dictamenSub') : undefined}
      />
      <section className="max-w-215 rounded-[14px] border border-line bg-surface">
        <div className="grid md:grid-cols-2 md:divide-x md:divide-line max-md:divide-y max-md:divide-line">
          <GrupoDatos titulo={t('comite.cliente')}>
            <DatoLectura etiqueta={t('campo.cedula')} valor={s.cedula} mono />
            <DatoLectura etiqueta={t('campo.nombreCompleto')} valor={s.nombreCompleto} />
            <DatoLectura etiqueta={t('campo.edad')} valor={s.edad} />
          </GrupoDatos>
          <GrupoDatos titulo={t('comite.credito')}>
            <DatoLectura etiqueta={t('campo.montoSolicitado')} valor={formatearDinero(s.montoSolicitado, locale)} mono />
            <DatoLectura etiqueta={t('campo.cantidadCuotas')} valor={s.cantidadCuotas} />
            <DatoLectura etiqueta={t('campo.periodicidad')} valor={t(`periodicidad.${s.periodicidad}`)} />
            <DatoLectura etiqueta={t('campo.plazo')} valor={plazo} />
          </GrupoDatos>
        </div>
        {activa ? (
          <div className="grid gap-3.5 rounded-b-[14px] border-t border-line bg-surface-2 p-5">
            <Field id="observaciones" etiqueta={t('campo.observaciones')} error={error}
              ayuda={<span className="text-right font-mono text-[11.5px] text-muted">{observaciones.length} / {MAX_OBSERVACIONES}</span>}>
              <TextArea rows={4} maxLength={MAX_OBSERVACIONES} value={observaciones} className="bg-surface"
                onChange={(e) => { setObservaciones(e.target.value); if (e.target.value.trim()) setError(undefined); }} />
            </Field>
            <div className="flex flex-wrap items-center justify-end gap-2.5">
              {!hayObservaciones && <span className="mr-auto text-[12.5px] text-muted">{t('comite.pista')}</span>}
              {/* aria-disabled en lugar de disabled: el clic sigue llegando para explicar qué falta. */}
              <Button variante="secundario" aria-disabled={!hayObservaciones} onClick={() => pedir('rechazar')}>{t('comite.rechazar')}</Button>
              <Button aria-disabled={!hayObservaciones} onClick={() => pedir('aprobar')}>{t('comite.aprobar')}</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 border-t border-line px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <BadgeEstado estado={s.estado} />
              <p className="text-muted">
                {t('comite.yaDictaminada')}
                {s.dictaminadaPor && s.dictaminadaEn && ` ${t('comite.dictaminadaPor', { usuario: s.dictaminadaPor.username, cuando: formatearRelativo(s.dictaminadaEn, locale) })}`}
              </p>
              <span className="flex gap-2 sm:ml-auto">
                <Link to={`/solicitudes/${s.id}`} className={claseBoton('secundario', 'sm')}>{t('comite.verExpediente')}</Link>
                <Link to="/comite" className={claseBoton('primario', 'sm')}>{t('comite.volverBandeja')}</Link>
              </span>
            </div>
            {s.observaciones && (
              <div>
                <span className="text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">{t('campo.observaciones')}</span>
                <p className="mt-1 [overflow-wrap:anywhere]">{s.observaciones}</p>
              </div>
            )}
          </div>
        )}
      </section>
      <ConfirmDialog
        abierto={pendiente !== null}
        titulo={t(esRechazo ? 'comite.rechazar' : 'comite.aprobar')}
        mensaje={esRechazo
          ? t('comite.confirmarRechazar', { nombre: s.nombreCompleto })
          : t('comite.confirmarAprobar', { monto: formatearDinero(s.montoSolicitado, locale), plazo })}
        cita={observaciones.trim()}
        etiquetaConfirmar={t(esRechazo ? 'comite.rechazar' : 'comite.aprobar')}
        variante={esRechazo ? 'peligro' : 'primario'}
        cargando={dictaminar.isPending}
        onConfirmar={() => void confirmar()}
        onCancelar={() => setPendiente(null)}
      />
    </>
  );
}
