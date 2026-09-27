import { EstadoSolicitud, puedeEjecutar, resolverMensaje } from '@credito/domain';
import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../../shared/api/ApiError';
import { useBancos } from '../../shared/api/catalogos';
import { useCredito, useDesembolsar } from '../../shared/api/creditos';
import { formatearDinero, formatearInstante, textoPlazo } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { BadgeEstado } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { Field, Input, Select } from '../../shared/ui/Campos';
import { Card } from '../../shared/ui/Card';
import { Cargando } from '../../shared/ui/Cargando';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { DatoLectura } from '../../shared/ui/DatoLectura';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { useToast } from '../../shared/ui/Toast';
import { TablaPlan } from '../plan-pagos/TablaPlan';

const PATRON_CUENTA = /^\d{6,30}$/;

export function DesembolsoPage() {
  const { t, locale } = useT();
  const toast = useToast();
  const id = Number(useParams().creditoId);
  const consulta = useCredito(id);
  const bancos = useBancos();
  const desembolsar = useDesembolsar();
  const [bancoId, setBancoId] = useState('');
  const [cuenta, setCuenta] = useState('');
  const [errores, setErrores] = useState<{ banco?: string; cuenta?: string }>({});
  const [confirmando, setConfirmando] = useState(false);
  const enviando = useRef(false);

  if (consulta.isPending) return <Cargando />;
  if (consulta.isError) return <ErrorConsulta error={consulta.error} onReintentar={() => void consulta.refetch()} />;
  const c = consulta.data;
  const disponible = puedeEjecutar(c.estado, 'desembolsar');
  const banco = bancos.data?.find((b) => String(b.id) === bancoId);

  const pedir = () => {
    const nuevos = {
      banco: bancoId ? undefined : resolverMensaje('REQUERIDO', {}, locale),
      cuenta: !cuenta.trim()
        ? resolverMensaje('REQUERIDO', {}, locale)
        : PATRON_CUENTA.test(cuenta.trim()) ? undefined : resolverMensaje('FORMATO_INVALIDO', {}, locale),
    };
    setErrores(nuevos);
    if (!nuevos.banco && !nuevos.cuenta) setConfirmando(true);
  };

  const confirmar = async () => {
    if (enviando.current) return;
    enviando.current = true;
    try {
      await desembolsar.mutateAsync({ creditoId: id, bancoId: Number(bancoId), numeroCuenta: cuenta.trim() });
      toast.exito(t('desembolso.exito', { numero: c.numero }));
    } catch (e) {
      if (e instanceof ApiError && e.details.length > 0) {
        const deCuenta = e.details.find((d) => d.field === 'numeroCuenta');
        const deBanco = e.details.find((d) => d.field === 'bancoId');
        if (deCuenta || deBanco) {
          setErrores({ cuenta: deCuenta?.message, banco: deBanco?.message });
        } else {
          toast.error(e.message);
        }
      } else {
        toast.error(e instanceof ApiError ? e.message : String(e));
      }
    } finally {
      setConfirmando(false);
      enviando.current = false;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{t('desembolso.detalle', { numero: c.numero })}</h1>
        <BadgeEstado estado={c.estado} />
      </div>
      <Card>
        <dl className="grid gap-4 sm:grid-cols-3">
          <DatoLectura etiqueta={t('campo.cedula')} valor={c.cedula} />
          <DatoLectura etiqueta={t('campo.nombreCompleto')} valor={c.nombreCompleto} />
          <DatoLectura etiqueta={t('campo.monto')} valor={formatearDinero(c.monto, locale)} />
          <DatoLectura etiqueta={t('campo.tasa')} valor={`${c.tasaAnual} %`} />
          <DatoLectura etiqueta={t('campo.periodicidad')} valor={t(`periodicidad.${c.periodicidad}`)} />
          <DatoLectura etiqueta={t('campo.plazo')} valor={textoPlazo(c.plazo, c.periodicidad, t)} />
        </dl>
      </Card>

      {disponible && (
        <Card titulo={t('desembolso.transferencia')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="banco" etiqueta={t('campo.banco')} error={errores.banco}>
              <Select value={bancoId} onChange={(e) => setBancoId(e.target.value)}>
                <option value="">{t('campo.seleccione')}</option>
                {bancos.data?.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </Select>
            </Field>
            <Field id="cuenta" etiqueta={t('campo.numeroCuenta')} error={errores.cuenta}>
              <Input inputMode="numeric" value={cuenta} onChange={(e) => setCuenta(e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={pedir}>{t('desembolso.procesar')}</Button>
          </div>
        </Card>
      )}

      {c.desembolso && (
        <Card titulo={t('desembolso.realizado')}>
          <dl className="grid gap-4 sm:grid-cols-4">
            <DatoLectura etiqueta={t('campo.banco')} valor={c.desembolso.banco.nombre} />
            <DatoLectura etiqueta={t('campo.numeroCuenta')} valor={c.desembolso.numeroCuenta} />
            <DatoLectura etiqueta={t('campo.fecha')} valor={formatearInstante(c.desembolso.ejecutadoEn, locale)} />
            <DatoLectura etiqueta={t('desembolso.ejecutadoPor')} valor={c.desembolso.ejecutadoPor.username} />
          </dl>
        </Card>
      )}

      {c.estado === EstadoSolicitud.DESEMBOLSADA && <TablaPlan creditoId={id} />}
      {!disponible && c.estado !== EstadoSolicitud.DESEMBOLSADA && (
        <p className="text-sm text-slate-600">{t('desembolso.noDisponible')}</p>
      )}

      <ConfirmDialog
        abierto={confirmando}
        titulo={t('desembolso.procesar')}
        mensaje={t('desembolso.confirmar', { monto: formatearDinero(c.monto, locale), banco: banco?.nombre ?? '', cuenta: cuenta.trim() })}
        etiquetaConfirmar={t('desembolso.procesar')}
        cargando={desembolsar.isPending}
        onConfirmar={() => void confirmar()}
        onCancelar={() => setConfirmando(false)}
      />
    </div>
  );
}
