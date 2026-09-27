import { type FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCredito, useCreditosPorCedula } from '../../shared/api/creditos';
import { useSolicitudes } from '../../shared/api/solicitudes';
import type { CreditoResumen } from '../../shared/api/tipos';
import { formatearDinero, formatearTasa, textoPlazo } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { BadgeEstado } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { Field, Input } from '../../shared/ui/Campos';
import { Cargando } from '../../shared/ui/Cargando';
import { Encabezado } from '../../shared/ui/Encabezado';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { Icono } from '../../shared/ui/Icono';
import { Vacio } from '../../shared/ui/Vacio';
import { TablaPlan } from './TablaPlan';

function SinCreditos({ cedula }: { cedula: string }) {
  const { t } = useT();
  // Si hay una solicitud con esa cédula, se explica por qué todavía no hay plan.
  const solicitudes = useSolicitudes({ cedula, page: 1 });
  const s = solicitudes.data?.items[0];
  return (
    <section className="rounded-[14px] border border-line bg-surface">
      <Vacio icono="calendario" titulo={t('plan.sinCreditos')}>
        <p>{s ? t('plan.sinCreditosSolicitud', { nombre: s.nombreCompleto, estado: t(`estado.${s.estado}`).toLowerCase() }) : t('plan.sinCreditosAyuda')}</p>
      </Vacio>
    </section>
  );
}

function ResumenCredito({ credito }: { credito: CreditoResumen }) {
  const { t, locale } = useT();
  const detalle = useCredito(credito.id);
  const grupo = 'grid content-start gap-1.5 p-5';
  const titulo = 'text-[12.5px] font-semibold text-muted';
  return (
    <section className="grid rounded-[14px] border border-line bg-surface md:grid-cols-3 md:divide-x md:divide-line max-md:divide-y max-md:divide-line">
      <div className={grupo}>
        <span className={titulo}>{t('comite.cliente')}</span>
        <b className="font-medium">{credito.nombreCompleto}</b>
        <span className="font-mono text-xs text-muted">{credito.cedula}</span>
      </div>
      <div className={grupo}>
        <span className={titulo}>{t('comite.credito')}</span>
        <b className="font-semibold tabular-nums">{formatearDinero(credito.monto, locale)}</b>
        <span className="text-[12.5px] text-muted">
          {detalle.data && `${t('plan.tasaAnual', { tasa: formatearTasa(detalle.data.tasaAnual, locale) })} · `}
          {textoPlazo(credito.plazo, credito.periodicidad, t)}
        </span>
      </div>
      <div className={grupo}>
        <span className={titulo}>{t('campo.estado')}</span>
        <div><BadgeEstado estado={credito.estado} /></div>
      </div>
    </section>
  );
}

export function ConsultaPage() {
  const { t, locale } = useT();
  const [parametros, setParametros] = useSearchParams();
  const cedula = parametros.get('cedula') ?? '';
  const elegido = Number(parametros.get('credito')) || null;
  const [texto, setTexto] = useState(cedula);
  // Si la URL cambia sin desmontar la página (Atrás, el menú lateral), el campo vuelve a mostrar la cédula buscada.
  const [cedulaMostrada, setCedulaMostrada] = useState(cedula);
  if (cedulaMostrada !== cedula) {
    setCedulaMostrada(cedula);
    setTexto(cedula);
  }
  const consulta = useCreditosPorCedula(cedula);
  const creditos = consulta.data?.items ?? [];
  const seleccionado = creditos.length === 1 ? creditos[0] : creditos.find((c) => c.id === elegido);

  // La cédula buscada y el crédito elegido viven en la URL: el enlace desde el expediente llega con ellos y Atrás los conserva.
  const buscar = (evento: FormEvent) => {
    evento.preventDefault();
    setParametros(texto.trim() ? { cedula: texto.trim() } : {});
  };
  const elegir = (id: number) => setParametros({ cedula, credito: String(id) }, { replace: true });

  return (
    <>
      <Encabezado titulo={t('plan.titulo')} subtitulo={t('plan.sub')} />
      <form onSubmit={buscar} className="rounded-[14px] border border-line bg-surface p-5">
        <div className="flex flex-wrap items-end gap-2.5">
          <Field id="cedula" etiqueta={t('campo.cedula')} className="max-w-90 min-w-55 flex-1">
            <Input className="font-mono text-[13px]" placeholder="001-000000-0000X" autoComplete="off" value={texto} onChange={(e) => setTexto(e.target.value)} />
          </Field>
          <Button type="submit" disabled={!texto.trim()}><Icono nombre="buscar" />{t('comun.buscar')}</Button>
        </div>
      </form>

      {cedula && consulta.isPending && <Cargando />}
      {cedula && consulta.isError && (
        <ErrorConsulta error={consulta.error} onReintentar={() => void consulta.refetch()} />
      )}
      {cedula && consulta.isSuccess && creditos.length === 0 && <SinCreditos cedula={cedula} />}
      {creditos.length > 1 && (
        <section className="grid gap-4 rounded-[14px] border border-line bg-surface p-5">
          <div>
            <h2 className="text-[15px] font-bold">{t('plan.variosTitulo', { nombre: creditos[0]!.nombreCompleto, n: creditos.length })}</h2>
            <p className="text-[13px] text-muted">{t('plan.elegir')}</p>
          </div>
          <ul className="grid gap-2">
            {creditos.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => elegir(c.id)} aria-pressed={c.id === seleccionado?.id}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[10px] border border-line bg-surface px-3.5 py-3 text-left text-ink transition hover:border-accent active:scale-[0.99] aria-pressed:border-accent aria-pressed:bg-accent-soft">
                  <span className="font-mono">{c.numero}</span>
                  <span>{formatearDinero(c.monto, locale)} · {textoPlazo(c.plazo, c.periodicidad, t)}</span>
                  <BadgeEstado estado={c.estado} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {seleccionado && (
        <>
          <ResumenCredito credito={seleccionado} />
          <TablaPlan creditoId={seleccionado.id} />
        </>
      )}
    </>
  );
}
