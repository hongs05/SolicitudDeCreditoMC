import { puedeEjecutar, resolverMensaje } from '@credito/domain';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../shared/api/ApiError';
import { useSolicitud } from '../../shared/api/solicitudes';
import { formatearDinero, textoPlazo } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { BadgeEstado } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { Field, TextArea } from '../../shared/ui/Campos';
import { Card } from '../../shared/ui/Card';
import { Cargando } from '../../shared/ui/Cargando';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { DatoLectura } from '../../shared/ui/DatoLectura';
import { useToast } from '../../shared/ui/Toast';
import { type AccionDictamen, useDictaminar } from './api';

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
  if (consulta.isError) return <p role="alert" className="text-red-700">{(consulta.error as Error).message}</p>;
  const s = consulta.data;
  const activa = puedeEjecutar(s.estado, 'aprobar');

  const pedir = (accion: AccionDictamen) => {
    if (!observaciones.trim()) {
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
      toast.exito(r.credito ? t('comite.aprobada', { numero: r.credito.numero }) : t('comite.rechazada', { id }));
      navegar('/comite');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
      setPendiente(null);
    } finally {
      enviando.current = false;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{t('comite.dictamen', { id })}</h1>
        <BadgeEstado estado={s.estado} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card titulo={t('comite.cliente')}>
          <dl className="grid gap-3">
            <DatoLectura etiqueta={t('campo.cedula')} valor={s.cedula} />
            <DatoLectura etiqueta={t('campo.nombreCompleto')} valor={s.nombreCompleto} />
            <DatoLectura etiqueta={t('campo.edad')} valor={s.edad} />
          </dl>
        </Card>
        <Card titulo={t('comite.credito')}>
          <dl className="grid gap-3">
            <DatoLectura etiqueta={t('campo.montoSolicitado')} valor={formatearDinero(s.montoSolicitado, locale)} />
            <DatoLectura etiqueta={t('campo.cantidadCuotas')} valor={s.cantidadCuotas} />
            <DatoLectura etiqueta={t('campo.periodicidad')} valor={t(`periodicidad.${s.periodicidad}`)} />
            <DatoLectura etiqueta={t('campo.plazo')} valor={textoPlazo(s.cantidadCuotas, s.periodicidad, t)} />
          </dl>
        </Card>
      </div>
      {activa ? (
        <Card>
          <Field id="observaciones" etiqueta={t('campo.observaciones')} error={error}>
            <TextArea rows={4} maxLength={1000} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </Field>
          <div className="mt-4 flex justify-end gap-3">
            <Button variante="peligro" onClick={() => pedir('rechazar')}>{t('comite.rechazar')}</Button>
            <Button onClick={() => pedir('aprobar')}>{t('comite.aprobar')}</Button>
          </div>
        </Card>
      ) : (
        <p className="text-sm text-slate-600">{t('comite.yaDictaminada')}</p>
      )}
      <ConfirmDialog
        abierto={pendiente !== null}
        titulo={t(pendiente === 'rechazar' ? 'comite.rechazar' : 'comite.aprobar')}
        mensaje={t(pendiente === 'rechazar' ? 'comite.confirmarRechazar' : 'comite.confirmarAprobar', { id })}
        etiquetaConfirmar={t(pendiente === 'rechazar' ? 'comite.rechazar' : 'comite.aprobar')}
        variante={pendiente === 'rechazar' ? 'peligro' : 'primario'}
        cargando={dictaminar.isPending}
        onConfirmar={() => void confirmar()}
        onCancelar={() => setPendiente(null)}
      />
    </div>
  );
}
