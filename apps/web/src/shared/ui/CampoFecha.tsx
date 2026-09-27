import { diasEnMes, esFechaValida, formatearFecha as aIso, parsearFecha, sumarDias, sumarMeses } from '@credito/domain';
import { forwardRef, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { hoyNegocio, localeIntl } from '../format/formato';
import { useT } from '../i18n/I18nProvider';
import { CLASE_CONTROL } from './Campos';
import { Icono } from './Icono';

export interface CampoFechaProps {
  id?: string;
  name?: string;
  /** Fecha ISO (aaaa-mm-dd), o el texto a medio escribir para que la validación lo marque. */
  value: string;
  onChange(valor: string): void;
  onBlur?(): void;
  min?: string;
  max?: string;
  /** Fecha ISO que el calendario muestra al abrirse si todavía no hay una elegida. */
  referencia?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

const CLASE_CAMPO = `${CLASE_CONTROL} pr-10`;

/** `1990-03-15` → `15/03/1990`. Un texto que no es fecha se deja como está. */
const aTexto = (valor: string) => {
  if (!esFechaValida(valor)) return valor;
  const { anio, mes, dia } = parsearFecha(valor);
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
};

/** `15/03/1990` o `1990-03-15` → ISO. Lo incompleto o inválido se devuelve tal cual para que el esquema lo rechace. */
function deTexto(texto: string): string {
  const limpio = texto.trim();
  const partes = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(limpio);
  if (partes) {
    const iso = aIso(Number(partes[3]), Number(partes[2]), Number(partes[1]));
    return esFechaValida(iso) ? iso : limpio;
  }
  return limpio;
}

/** Mientras se escribe, agrega las barras: `15031990` → `15/03/1990`. Un ISO pegado se respeta. */
function enmascarar(texto: string): string {
  if (texto.includes('-')) return texto;
  const d = texto.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

const diaSemana = (iso: string) => {
  const { anio, mes, dia } = parsearFecha(iso);
  return new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
};

/** Misma fecha en otro mes, recortando el día si ese mes es más corto. */
const enMes = (anio: number, mes: number, dia: number) => aIso(anio, mes, Math.min(dia, diasEnMes(anio, mes)));

/**
 * Campo de fecha con calendario propio. El selector nativo no se puede estilizar
 * y en fechas de nacimiento obliga a retroceder mes a mes; aquí se elige mes y año.
 */
export const CampoFecha = forwardRef<HTMLInputElement, CampoFechaProps>(function CampoFecha(
  { id, name, value, onChange, onBlur, min, max, referencia, className = '', ...aria },
  ref,
) {
  const { t, locale } = useT();
  const idCalendario = useId();
  const [texto, setTexto] = useState(() => aTexto(value));
  const [valorVisto, setValorVisto] = useState(value);
  const [abierto, setAbierto] = useState(false);
  const [foco, setFoco] = useState(() => hoyNegocio());
  const contenedorRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const rejillaRef = useRef<HTMLDivElement>(null);
  const moverFoco = useRef(false);

  // Si el valor cambia desde fuera (Limpiar, Llenar con ejemplo), el texto lo sigue.
  if (value !== valorVisto) {
    setValorVisto(value);
    setTexto(aTexto(value));
  }

  const hoy = hoyNegocio();
  const fuera = (iso: string) => Boolean((min && iso < min) || (max && iso > max));
  const { anio: anioVista, mes: mesVista } = parsearFecha(foco);
  const anioMax = max ? parsearFecha(max).anio : parsearFecha(hoy).anio + 10;
  const anioMin = min ? parsearFecha(min).anio : anioMax - 100;

  const abrir = () => {
    const base = esFechaValida(value) ? value : referencia ?? max ?? hoy;
    setFoco(base);
    setAbierto(true);
    moverFoco.current = true;
  };
  const cerrar = (devolverFoco: boolean) => {
    setAbierto(false);
    if (devolverFoco) botonRef.current?.focus();
  };
  const elegir = (iso: string) => {
    if (fuera(iso)) return;
    setTexto(aTexto(iso));
    setValorVisto(iso);
    onChange(iso);
    onBlur?.();
    cerrar(true);
  };

  useEffect(() => {
    if (!abierto) return;
    const alPulsarFuera = (e: MouseEvent) => {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', alPulsarFuera);
    return () => document.removeEventListener('mousedown', alPulsarFuera);
  }, [abierto]);

  // Tras abrir o moverse con el teclado, el foco va al día activo.
  useEffect(() => {
    if (!abierto || !moverFoco.current) return;
    moverFoco.current = false;
    rejillaRef.current?.querySelector<HTMLButtonElement>(`[data-fecha="${foco}"]`)?.focus();
  }, [abierto, foco]);

  const irA = (iso: string) => {
    moverFoco.current = true;
    setFoco(iso);
  };
  const teclaRejilla = (e: KeyboardEvent<HTMLDivElement>) => {
    const dow = diaSemana(foco);
    const inicio = locale === 'es' ? 1 : 0;
    const desplazamientos: Record<string, () => string> = {
      ArrowLeft: () => sumarDias(foco, -1),
      ArrowRight: () => sumarDias(foco, 1),
      ArrowUp: () => sumarDias(foco, -7),
      ArrowDown: () => sumarDias(foco, 7),
      PageUp: () => sumarMeses(foco, -1),
      PageDown: () => sumarMeses(foco, 1),
      Home: () => sumarDias(foco, -((dow - inicio + 7) % 7)),
      End: () => sumarDias(foco, 6 - ((dow - inicio + 7) % 7)),
    };
    const destino = desplazamientos[e.key];
    if (!destino) return;
    e.preventDefault();
    irA(destino());
  };

  // Rejilla de 6 semanas que empieza el lunes (es) o el domingo (en).
  const inicioSemana = locale === 'es' ? 1 : 0;
  const primero = aIso(anioVista, mesVista, 1);
  const desde = sumarDias(primero, -((diaSemana(primero) - inicioSemana + 7) % 7));
  const dias = Array.from({ length: 42 }, (_, i) => sumarDias(desde, i));
  const intl = localeIntl(locale);
  const nombreDia = (dow: number) =>
    new Intl.DateTimeFormat(intl, { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(Date.UTC(2023, 11, 31 + dow)));
  const nombreMes = (mes: number) =>
    new Intl.DateTimeFormat(intl, { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, mes - 1, 1)));
  const fechaLarga = (iso: string) => {
    const { anio, mes, dia } = parsearFecha(iso);
    return new Intl.DateTimeFormat(intl, { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(Date.UTC(anio, mes - 1, dia)));
  };
  const anios = Array.from({ length: anioMax - anioMin + 1 }, (_, i) => anioMax - i);
  const mesAnteriorFuera = Boolean(min && sumarDias(primero, -1) < min);
  const mesSiguienteFuera = Boolean(max && aIso(anioVista, mesVista, diasEnMes(anioVista, mesVista)) >= max);
  const claseSelector = 'control-select min-w-0 rounded-full border border-line bg-surface py-1 pr-7 pl-2.5 text-[13px] font-semibold text-ink capitalize [background-position:right_7px_center] [background-size:14px] focus:border-accent focus:outline-none';
  const claseFlecha = 'grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent';

  return (
    <div ref={contenedorRef} className="relative">
      <input
        ref={ref} id={id} name={name} type="text" inputMode="numeric" autoComplete="off" maxLength={10}
        placeholder={t('fecha.formato')} value={texto} {...aria}
        className={`${CLASE_CAMPO} ${className}`}
        onChange={(e) => {
          const nuevo = enmascarar(e.target.value);
          const valor = deTexto(nuevo);
          setTexto(nuevo);
          setValorVisto(valor);
          onChange(valor);
        }}
        onBlur={() => {
          if (esFechaValida(value)) setTexto(aTexto(value));
          onBlur?.();
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); abrir(); }
        }}
      />
      <button ref={botonRef} type="button" aria-label={t('fecha.abrirCalendario')} aria-haspopup="dialog"
        aria-expanded={abierto} aria-controls={abierto ? idCalendario : undefined}
        onClick={() => (abierto ? cerrar(false) : abrir())}
        className="absolute inset-y-1 right-1 grid w-8 place-items-center rounded-[8px] text-muted hover:bg-surface-2 hover:text-ink">
        <Icono nombre="calendario" />
      </button>

      {abierto && (
        <div id={idCalendario} role="dialog" aria-label={t('fecha.calendario')}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); cerrar(true); } }}
          className="anim-dialogo absolute top-[calc(100%+6px)] right-0 z-50 grid w-[304px] max-w-[calc(100vw-32px)] gap-2.5 rounded-[14px] border border-line bg-surface p-3 shadow-float">
          <div className="flex items-center gap-1.5">
            <button type="button" className={claseFlecha} aria-label={t('fecha.mesAnterior')} disabled={mesAnteriorFuera}
              onClick={() => setFoco(sumarMeses(foco, -1))}>
              <Icono nombre="izquierda" />
            </button>
            <select aria-label={t('fecha.mes')} className={`${claseSelector} flex-1`} value={mesVista}
              onChange={(e) => setFoco(enMes(anioVista, Number(e.target.value), parsearFecha(foco).dia))}>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{nombreMes(i + 1)}</option>)}
            </select>
            <select aria-label={t('fecha.anio')} className={`${claseSelector} font-mono`} value={anioVista}
              onChange={(e) => setFoco(enMes(Number(e.target.value), mesVista, parsearFecha(foco).dia))}>
              {anios.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button type="button" className={claseFlecha} aria-label={t('fecha.mesSiguiente')} disabled={mesSiguienteFuera}
              onClick={() => setFoco(sumarMeses(foco, 1))}>
              <Icono nombre="derecha" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-faint uppercase" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => <span key={i} className="py-1">{nombreDia((inicioSemana + i) % 7)}</span>)}
          </div>
          <div ref={rejillaRef} className="grid grid-cols-7 gap-y-0.5" onKeyDown={teclaRejilla}>
            {dias.map((iso) => {
              const { mes } = parsearFecha(iso);
              const elegida = iso === value;
              const esHoy = iso === hoy;
              const deshabilitada = fuera(iso);
              return (
                <button key={iso} type="button" data-fecha={iso} tabIndex={iso === foco ? 0 : -1}
                  aria-label={fechaLarga(iso)} aria-pressed={elegida} aria-current={esHoy ? 'date' : undefined}
                  aria-disabled={deshabilitada || undefined}
                  onClick={() => elegir(iso)}
                  className={`mx-auto grid size-9 place-items-center rounded-full text-[13px] tabular-nums transition-colors focus-visible:outline-offset-0 ${
                    elegida ? 'bg-accent font-semibold text-on-accent'
                      : deshabilitada ? 'cursor-not-allowed text-faint opacity-40'
                        : `${mes === mesVista ? 'text-ink' : 'text-faint'} hover:bg-surface-2 ${esHoy ? 'font-semibold text-accent-strong ring-1 ring-accent ring-inset' : ''}`
                  }`}>
                  {parsearFecha(iso).dia}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
