import { EstadoSolicitud, puedeEjecutar, resolverMensaje } from '@credito/domain';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../shared/api/ApiError';
import { useBancos } from '../../shared/api/catalogos';
import { useCredito, useDesembolsar } from '../../shared/api/creditos';
import { formatearDinero, formatearInstante, formatearRelativo, formatearTasa, textoPlazo } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { avisarError } from '../../shared/ui/avisarError';
import { BadgeEstado } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { Field, Input, Select } from '../../shared/ui/Campos';
import { Cargando } from '../../shared/ui/Cargando';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { DatoLectura, GrupoDatos } from '../../shared/ui/DatoLectura';
import { Encabezado } from '../../shared/ui/Encabezado';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { Icono } from '../../shared/ui/Icono';
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
  const [conflicto, setConflicto] = useState<string | null>(null);
  const navegar = useNavigate();
  const enviando = useRef(false);

  if (consulta.isPending) return <Cargando />;
  if (consulta.isError) return <ErrorConsulta error={consulta.error} onReintentar={() => void consulta.refetch()} />;
  const c = consulta.data;
  const disponible = puedeEjecutar(c.estado, 'desembolsar');
  const banco = bancos.data?.find((b) => String(b.id) === bancoId);
  const d = c.desembolso;

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
    const numeroCuenta = cuenta.trim();
    try {
      await desembolsar.mutateAsync({ creditoId: id, bancoId: Number(bancoId), numeroCuenta });
      toast.exito(t('desembolso.exito', { numero: c.numero }), {
        detalle: t('desembolso.exitoDetalle', { banco: banco?.nombre ?? '', ultimos: numeroCuenta.slice(-4) }),
      });
    } catch (e) {
      if (e instanceof ApiError && e.details.length > 0) {
        const deCuenta = e.details.find((det) => det.field === 'numeroCuenta');
        const deBanco = e.details.find((det) => det.field === 'bancoId');
        if (deCuenta || deBanco) {
          setErrores({ cuenta: deCuenta?.message, banco: deBanco?.message });
        } else {
          toast.error(e.message);
        }
      } else if (e instanceof ApiError && (e.code === 'CREDITO_YA_DESEMBOLSADO' || e.code === 'CREDITO_NO_APROBADO')) {
        // Otro cajero lo desembolsó, o el crédito cambió de estado: se explica en un modal.
        setConflicto(e.message);
      } else {
        avisarError(toast, e, { generico: t('comun.errorGenerico'), reintentar: t('comun.reintentar') }, () => setConfirmando(true));
      }
    } finally {
      setConfirmando(false);
      enviando.current = false;
    }
  };

  const subtitulo = disponible ? t('desembolso.subDetalle') : d ? t('desembolso.subHecho', { cuando: formatearRelativo(d.ejecutadoEn, locale) }) : undefined;

  return (
    <>
      <Encabezado
        migas={[{ texto: t('desembolso.titulo'), a: '/desembolsos' }, { texto: c.numero }]}
        titulo={<>{t('desembolso.detalle', { numero: c.numero })} <BadgeEstado estado={c.estado} /></>}
        subtitulo={subtitulo}
      />
      <section className="max-w-215 rounded-[14px] border border-line bg-surface">
        <div className="grid md:grid-cols-2 md:divide-x md:divide-line max-md:divide-y max-md:divide-line">
          <GrupoDatos titulo={t('comite.cliente')}>
            <DatoLectura etiqueta={t('campo.cedula')} valor={c.cedula} mono />
            <DatoLectura etiqueta={t('campo.nombreCompleto')} valor={c.nombreCompleto} />
          </GrupoDatos>
          <GrupoDatos titulo={t('desembolso.condiciones')}>
            <DatoLectura etiqueta={t('campo.monto')} valor={formatearDinero(c.monto, locale)} mono />
            <DatoLectura etiqueta={t('campo.tasa')} valor={formatearTasa(c.tasaAnual, locale)} mono />
            <DatoLectura etiqueta={t('campo.periodicidad')} valor={t(`periodicidad.${c.periodicidad}`)} />
            <DatoLectura etiqueta={t('campo.plazo')} valor={textoPlazo(c.plazo, c.periodicidad, t)} />
          </GrupoDatos>
        </div>

        {disponible && (
          <div className="grid gap-3.5 rounded-b-[14px] border-t border-line bg-surface-2 p-5">
            <h2 className="text-[15px] font-bold">{t('desembolso.transferencia')}</h2>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field id="banco" etiqueta={t('campo.banco')} error={errores.banco}
                ayuda={bancos.isError && (
                  <span role="alert" className="flex items-center gap-2 text-xs text-danger">
                    {t('comun.errorGenerico')}
                    <button type="button" className="font-semibold underline" onClick={() => void bancos.refetch()}>{t('comun.reintentar')}</button>
                  </span>
                )}>
                <Select value={bancoId} className="bg-surface" onChange={(e) => { setBancoId(e.target.value); setErrores((x) => ({ ...x, banco: undefined })); }}>
                  <option value="">{t('campo.seleccione')}</option>
                  {bancos.data?.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </Select>
              </Field>
              <Field id="cuenta" etiqueta={t('campo.numeroCuenta')} error={errores.cuenta}>
                <Input inputMode="numeric" autoComplete="off" maxLength={30} placeholder={t('desembolso.soloDigitos')} className="bg-surface font-mono text-[13px]"
                  value={cuenta} onChange={(e) => { setCuenta(e.target.value); setErrores((x) => ({ ...x, cuenta: undefined })); }} />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button onClick={pedir}><Icono nombre="banco" />{t('desembolso.procesar')}</Button>
            </div>
          </div>
        )}

        {d && (
          <div className="border-t border-line">
            <h2 className="px-5 pt-4 text-[15px] font-bold">{t('desembolso.realizado')}</h2>
            <dl className="grid gap-2.5 px-5 pt-3 pb-5 md:grid-cols-2 md:gap-x-10">
              <DatoLectura etiqueta={t('campo.banco')} valor={d.banco.nombre} />
              <DatoLectura etiqueta={t('desembolso.ejecutadoPor')} valor={d.ejecutadoPor.username} />
              <DatoLectura etiqueta={t('campo.numeroCuenta')} valor={d.numeroCuenta} mono />
              <DatoLectura etiqueta={t('campo.fecha')} valor={formatearInstante(d.ejecutadoEn, locale)} />
            </dl>
          </div>
        )}

        {!disponible && c.estado !== EstadoSolicitud.DESEMBOLSADA && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3.5">
            <BadgeEstado estado={c.estado} />
            <p className="text-muted">{t('desembolso.noDisponible')}</p>
          </div>
        )}
      </section>

      {c.estado === EstadoSolicitud.DESEMBOLSADA && (
        <div className="max-w-215"><TablaPlan creditoId={id} /></div>
      )}

      <ConfirmDialog
        abierto={confirmando}
        titulo={t('desembolso.procesar')}
        mensaje={t('desembolso.confirmar', { monto: formatearDinero(c.monto, locale), nombre: c.nombreCompleto })}
        cita={t('desembolso.cita', { banco: banco?.nombre ?? '', cuenta: cuenta.trim() })}
        etiquetaConfirmar={t('desembolso.procesar')}
        cargando={desembolsar.isPending}
        onConfirmar={() => void confirmar()}
        onCancelar={() => setConfirmando(false)}
      />
      <ConfirmDialog
        abierto={conflicto !== null}
        tono="error"
        titulo={t('error.noDesembolsableTitulo')}
        mensaje={t('error.conflictoTexto')}
        cita={conflicto ?? undefined}
        etiquetaConfirmar={t('comite.volverBandeja')}
        etiquetaCancelar={t('comun.entendido')}
        onConfirmar={() => navegar('/desembolsos')}
        onCancelar={() => setConflicto(null)}
      />
    </>
  );
}
