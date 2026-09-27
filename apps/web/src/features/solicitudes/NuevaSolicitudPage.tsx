import { Periodicidad } from '@credito/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../shared/api/ApiError';
import { useTiposEmpleo } from '../../shared/api/catalogos';
import { useCrearSolicitud } from '../../shared/api/solicitudes';
import { hoyNegocio } from '../../shared/format/formato';
import type { ClaveTexto } from '../../shared/i18n/es';
import { useT } from '../../shared/i18n/I18nProvider';
import { Button } from '../../shared/ui/Button';
import { Field, Input, Select } from '../../shared/ui/Campos';
import { Card } from '../../shared/ui/Card';
import { useToast } from '../../shared/ui/Toast';
import { aCuerpoSolicitud, crearEsquemaSolicitud, VALORES_INICIALES, type ValoresSolicitud } from './esquema';
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

export function NuevaSolicitudPage() {
  const { t, locale } = useT();
  const toast = useToast();
  const navegar = useNavigate();
  const hoy = useMemo(() => hoyNegocio(), []);
  const esquema = useMemo(() => crearEsquemaSolicitud(hoy, locale), [hoy, locale]);
  const tipos = useTiposEmpleo();
  const crear = useCrearSolicitud();

  const {
    register, handleSubmit, setError, watch, trigger,
    formState: { errors, isSubmitted },
  } = useForm<ValoresSolicitud>({ resolver: zodResolver(esquema), mode: 'onTouched', defaultValues: VALORES_INICIALES });

  const esquemaAnterior = useRef(esquema);
  useEffect(() => {
    if (esquemaAnterior.current === esquema) return;
    esquemaAnterior.current = esquema;
    if (isSubmitted) void trigger();
  }, [esquema, isSubmitted, trigger]);

  const resumen = resumirSolicitud(watch(), hoy);

  const enviar = handleSubmit(async (valores) => {
    try {
      const creada = await crear.mutateAsync(aCuerpoSolicitud(valores));
      toast.exito(t('solicitud.creada', { id: creada.id }));
      navegar('/solicitudes');
    } catch (error) {
      if (error instanceof ApiError && error.details.length > 0) {
        for (const detalle of error.details) {
          if (esCampo(detalle.field)) setError(detalle.field, { message: detalle.message });
        }
      } else {
        toast.error(error instanceof ApiError ? error.message : String(error));
      }
    }
  });

  const campo = (nombre: NombreCampo, props: Record<string, unknown> = {}) => (
    <Field id={nombre} etiqueta={t(ETIQUETAS[nombre])} error={errors[nombre]?.message}>
      <Input {...register(nombre)} {...props} />
    </Field>
  );

  const selector = (nombre: 'tipoEmpleoId' | 'periodicidad', opciones: { valor: string; texto: string }[]) => (
    <Field id={nombre} etiqueta={t(ETIQUETAS[nombre])} error={errors[nombre]?.message}>
      <Select {...register(nombre)}>
        <option value="">{t('campo.seleccione')}</option>
        {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
      </Select>
    </Field>
  );

  return (
    <form onSubmit={enviar} noValidate className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <h1 className="text-2xl font-semibold">{t('solicitud.titulo')}</h1>
        <Card titulo={t('solicitud.personal')}>
          <div className="grid gap-4 sm:grid-cols-2">
            {campo('nombreCompleto', { autoComplete: 'name' })}
            {campo('cedula')}
            {campo('correo', { type: 'email', autoComplete: 'email' })}
            {campo('telefono', { type: 'tel', autoComplete: 'tel' })}
            {campo('fechaNacimiento', { type: 'date', max: hoy })}
          </div>
        </Card>
        <Card titulo={t('solicitud.laboral')}>
          <div className="grid gap-4 sm:grid-cols-2">
            {selector('tipoEmpleoId', (tipos.data ?? []).map((tipo) => ({ valor: String(tipo.id), texto: tipo.nombre })))}
            {campo('empresa')}
            {campo('antiguedadAnios', { inputMode: 'numeric' })}
            {campo('ingresoMensual', { inputMode: 'decimal' })}
          </div>
        </Card>
        <Card titulo={t('solicitud.condiciones')}>
          <div className="grid gap-4 sm:grid-cols-2">
            {campo('montoSolicitado', { inputMode: 'decimal' })}
            {campo('cantidadCuotas', { inputMode: 'numeric' })}
            {campo('tasaAnual', { inputMode: 'decimal' })}
            {selector('periodicidad', Object.values(Periodicidad).map((p) => ({ valor: p, texto: t(`periodicidad.${p}`) })))}
          </div>
        </Card>
      </div>
      <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <PanelCuota resumen={resumen} />
        <Button type="submit" cargando={crear.isPending} disabled={resumen.edadExcedida}>
          {t('solicitud.enviar')}
        </Button>
      </aside>
    </form>
  );
}
