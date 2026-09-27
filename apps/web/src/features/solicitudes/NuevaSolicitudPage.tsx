import { EstadoSolicitud, Periodicidad } from '@credito/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../shared/api/ApiError';
import { useTiposEmpleo } from '../../shared/api/catalogos';
import { useCrearSolicitud, useSolicitudes } from '../../shared/api/solicitudes';
import { hoyNegocio, numeroSolicitud } from '../../shared/format/formato';
import type { ClaveTexto } from '../../shared/i18n/es';
import { useT } from '../../shared/i18n/I18nProvider';
import { avisarError } from '../../shared/ui/avisarError';
import { Button } from '../../shared/ui/Button';
import { Field, Input, Select } from '../../shared/ui/Campos';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { Encabezado } from '../../shared/ui/Encabezado';
import { useToast } from '../../shared/ui/Toast';
import { aCuerpoSolicitud, crearEsquemaSolicitud, VALORES_EJEMPLO, VALORES_INICIALES, type ValoresSolicitud } from './esquema';
import { PanelCuota } from './PanelCuota';
import { resumirSolicitud } from './resumen-solicitud';

type NombreCampo = keyof ValoresSolicitud;

const ETIQUETAS: Record<NombreCampo, ClaveTexto> = {
  nombreCompleto: 'campo.nombreCompleto',
  cedula: 'campo.cedula',
  correo: 'campo.correo',
  telefono: 'campo.telefono',
  fechaNacimiento: 'campo.fechaNacimiento',
  tipoEmpleoId: 'campo.tipoEmpleo',
  empresa: 'campo.empresa',
  antiguedadAnios: 'campo.antiguedadAnios',
  ingresoMensual: 'campo.ingresoMensual',
  montoSolicitado: 'campo.montoSolicitado',
  cantidadCuotas: 'campo.cantidadCuotas',
  tasaAnual: 'campo.tasaAnual',
  periodicidad: 'campo.periodicidad',
};

const esCampo = (nombre: string): nombre is NombreCampo => nombre in ETIQUETAS;
const PERIODICIDADES = [Periodicidad.QUINCENAL, Periodicidad.MENSUAL, Periodicidad.ANUAL];

/** Espera a que el valor deje de cambiar antes de usarlo, para no consultar la API en cada tecla. */
function useDiferido<T>(valor: T, ms = 400): T {
  const [diferido, setDiferido] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setDiferido(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return diferido;
}

function Bloque({ numero, titulo, detalle, children }: { numero: string; titulo: string; detalle?: string; children: ReactNode }) {
  return (
    <fieldset className="grid min-w-0 gap-3.5 border-0 px-5 py-5.5 not-first:border-t not-first:border-dashed not-first:border-line-strong">
      <legend className="float-left mb-0.5 flex w-full items-baseline gap-2.5 p-0 text-[17px] font-bold tracking-[-0.02em]">
        <span aria-hidden="true" className="font-mono text-xs font-medium tracking-normal text-accent">{numero}</span>
        {titulo}
        {detalle && <span className="text-[12.5px] font-normal tracking-normal text-muted">{detalle}</span>}
      </legend>
      <div className="clear-both grid gap-3.5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function NuevaSolicitudPage() {
  const { t, locale } = useT();
  const toast = useToast();
  const navegar = useNavigate();
  const hoy = useMemo(() => hoyNegocio(), []);
  const esquema = useMemo(() => crearEsquemaSolicitud(hoy, locale), [hoy, locale]);
  const tipos = useTiposEmpleo();
  const crear = useCrearSolicitud();
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false);

  const {
    register, handleSubmit, setError, watch, trigger, reset,
    formState: { errors, isSubmitted, isDirty },
  } = useForm<ValoresSolicitud>({ resolver: zodResolver(esquema), mode: 'onTouched', defaultValues: VALORES_INICIALES });

  const esquemaAnterior = useRef(esquema);
  useEffect(() => {
    if (esquemaAnterior.current === esquema) return;
    esquemaAnterior.current = esquema;
    if (isSubmitted) {
      void trigger();
    } else if (Object.keys(errors).length > 0) {
      void trigger(Object.keys(errors) as NombreCampo[]);
    }
  }, [esquema, isSubmitted, errors, trigger]);

  const valores = watch();
  const resumen = resumirSolicitud(valores, hoy);

  // Aviso no bloqueante: la misma cédula ya tiene una solicitud abierta (pendiente o aprobada sin desembolsar).
  const cedula = useDiferido(valores.cedula.trim());
  const previas = useSolicitudes({ cedula, page: 1 }, cedula.length >= 5);
  const abierta = cedula.length >= 5
    ? previas.data?.items.find((s) => s.estado === EstadoSolicitud.PENDIENTE || s.estado === EstadoSolicitud.APROBADA)
    : undefined;
  const avisos = abierta
    ? [t(abierta.estado === EstadoSolicitud.PENDIENTE ? 'panel.abiertaPendiente' : 'panel.abiertaAprobada', { numero: numeroSolicitud(abierta.id) })]
    : [];

  const enviar = handleSubmit(async (datos) => {
    try {
      const creada = await crear.mutateAsync(aCuerpoSolicitud(datos));
      toast.exito(t('solicitud.creada', { id: numeroSolicitud(creada.id) }), { detalle: t('solicitud.creadaDetalle') });
      navegar(`/solicitudes/${creada.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.details.length > 0) {
        const camposConocidos = error.details.filter((detalle) => esCampo(detalle.field));
        if (camposConocidos.length > 0) {
          for (const detalle of camposConocidos) {
            if (esCampo(detalle.field)) setError(detalle.field, { message: detalle.message });
          }
        } else {
          toast.error(error.message);
        }
      } else {
        avisarError(toast, error, { generico: t('comun.errorGenerico'), reintentar: t('comun.reintentar') }, () => void enviar());
      }
    }
  });

  const llenarEjemplo = () =>
    reset({ ...VALORES_EJEMPLO, tipoEmpleoId: String(tipos.data?.[0]?.id ?? '') }, { keepDefaultValues: true });

  const campo = (nombre: NombreCampo, props: Record<string, unknown> = {}, extra: { prefijo?: string; sufijo?: string; ancho?: boolean } = {}) => (
    <Field id={nombre} etiqueta={t(ETIQUETAS[nombre])} error={errors[nombre]?.message}
      prefijo={extra.prefijo} sufijo={extra.sufijo} className={extra.ancho ? 'sm:col-span-2' : ''}>
      <Input {...register(nombre)} {...props} />
    </Field>
  );

  const errorPeriodicidad = errors.periodicidad?.message;

  return (
    <>
      <Encabezado
        migas={[{ texto: t('nav.solicitudes'), a: '/solicitudes' }, { texto: t('solicitud.titulo') }]}
        titulo={t('solicitud.titulo')}
        subtitulo={t('solicitud.sub')}
      />
      <form onSubmit={enviar} noValidate className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 rounded-[14px] border border-line bg-surface">
          <Bloque numero="01" titulo={t('solicitud.personal')} detalle={t('solicitud.delCliente')}>
            {campo('nombreCompleto', { autoComplete: 'name' }, { ancho: true })}
            {campo('cedula', { className: 'font-mono text-[13px]', placeholder: '001-000000-0000X' })}
            {campo('fechaNacimiento', { type: 'date', max: hoy })}
            {campo('correo', { type: 'email', autoComplete: 'email' })}
            {campo('telefono', { type: 'tel', autoComplete: 'tel', className: 'font-mono text-[13px]' })}
          </Bloque>
          <Bloque numero="02" titulo={t('solicitud.laboral')}>
            <Field id="tipoEmpleoId" etiqueta={t(ETIQUETAS.tipoEmpleoId)} error={errors.tipoEmpleoId?.message}>
              <Select {...register('tipoEmpleoId')}>
                <option value="">{t('campo.seleccione')}</option>
                {(tipos.data ?? []).map((tipo) => <option key={tipo.id} value={String(tipo.id)}>{tipo.nombre}</option>)}
              </Select>
            </Field>
            {campo('empresa')}
            {campo('antiguedadAnios', { inputMode: 'numeric', className: 'font-mono text-[13px]' })}
            {campo('ingresoMensual', { inputMode: 'decimal', className: 'font-mono text-[13px]' }, { prefijo: 'C$' })}
          </Bloque>
          <Bloque numero="03" titulo={t('solicitud.condiciones')}>
            {campo('montoSolicitado', { inputMode: 'decimal', className: 'font-mono text-[13px]' }, { prefijo: 'C$' })}
            {campo('tasaAnual', { inputMode: 'decimal', className: 'font-mono text-[13px]' }, { sufijo: '%' })}
            {campo('cantidadCuotas', { inputMode: 'numeric', className: 'font-mono text-[13px]' })}
            <div className="grid content-start gap-1.5">
              <span id="periodicidad-etiqueta" className="text-[12.5px] font-semibold text-muted">{t(ETIQUETAS.periodicidad)}</span>
              <div role="radiogroup" aria-labelledby="periodicidad-etiqueta" aria-invalid={errorPeriodicidad ? true : undefined}
                aria-describedby={errorPeriodicidad ? 'periodicidad-error' : undefined}
                className="grid grid-cols-3 gap-0.5 rounded-[10px] border border-line bg-surface-2 p-[3px]">
                {PERIODICIDADES.map((p) => (
                  <label key={p} className="relative cursor-pointer">
                    <input type="radio" value={p} {...register('periodicidad')} className="peer sr-only" />
                    <span className="block rounded p-1.5 text-center text-[13px] text-muted transition-colors peer-checked:bg-accent peer-checked:font-semibold peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                      {t(`periodicidad.${p}`)}
                    </span>
                  </label>
                ))}
              </div>
              {errorPeriodicidad && <p id="periodicidad-error" className="text-xs text-danger">{errorPeriodicidad}</p>}
            </div>
          </Bloque>
          <div className="flex flex-wrap justify-between gap-2.5 rounded-b-[14px] border-t border-line bg-surface-2 px-5 py-3.5">
            <div className="flex flex-wrap gap-2">
              <Button variante="secundario" tamano="sm" onClick={() => (isDirty ? setConfirmarLimpiar(true) : reset(VALORES_INICIALES))}>
                {t('solicitud.limpiar')}
              </Button>
              <Button variante="discreto" tamano="sm" onClick={llenarEjemplo}>{t('solicitud.ejemplo')}</Button>
            </div>
            <Button type="submit" cargando={crear.isPending} disabled={resumen.edadExcedida}>{t('solicitud.enviar')}</Button>
          </div>
        </section>
        <aside className="xl:sticky xl:top-6">
          <PanelCuota resumen={resumen} periodicidad={valores.periodicidad} cuotas={valores.cantidadCuotas} avisos={avisos} />
        </aside>
      </form>
      <ConfirmDialog
        abierto={confirmarLimpiar}
        titulo={t('solicitud.limpiarTitulo')}
        mensaje={t('solicitud.limpiarTexto')}
        etiquetaConfirmar={t('solicitud.limpiar')}
        variante="peligro"
        onConfirmar={() => { reset(VALORES_INICIALES); setConfirmarLimpiar(false); }}
        onCancelar={() => setConfirmarLimpiar(false)}
      />
    </>
  );
}
