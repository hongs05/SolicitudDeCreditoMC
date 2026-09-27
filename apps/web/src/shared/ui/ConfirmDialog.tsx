import { type KeyboardEvent, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../i18n/I18nProvider';
import { Button } from './Button';
import { Icono } from './Icono';

export interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  /** Texto citado debajo del mensaje, como las observaciones o el banco y la cuenta. */
  cita?: string;
  etiquetaConfirmar: string;
  /** Texto del botón secundario; por defecto, Cancelar. En un aviso de error suele ser Entendido. */
  etiquetaCancelar?: string;
  variante?: 'primario' | 'peligro';
  /** Un aviso de error o de advertencia lleva un icono junto al título. */
  tono?: 'error' | 'aviso';
  cargando?: boolean;
  onConfirmar(): void;
  onCancelar(): void;
}

export function ConfirmDialog(p: ConfirmDialogProps) {
  const { t } = useT();
  const tituloId = useId();
  const mensajeId = useId();
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const confirmarRef = useRef<HTMLButtonElement>(null);
  const focoPrevioRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (p.abierto) {
      focoPrevioRef.current = document.activeElement as HTMLElement | null;
      cancelarRef.current?.focus();
    } else {
      focoPrevioRef.current?.focus();
      focoPrevioRef.current = null;
    }
  }, [p.abierto]);

  if (!p.abierto) return null;

  const manejarTecla = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      p.onCancelar();
      return;
    }
    if (evento.key === 'Tab') {
      if (evento.shiftKey && document.activeElement === cancelarRef.current) {
        evento.preventDefault();
        confirmarRef.current?.focus();
      } else if (!evento.shiftKey && document.activeElement === confirmarRef.current) {
        evento.preventDefault();
        cancelarRef.current?.focus();
      }
    }
  };

  const icono = p.tono && (
    <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-full ${p.tono === 'error' ? 'bg-danger-soft text-danger' : 'bg-pend-bg text-pend'}`}>
      <Icono nombre="alerta" className="size-4.5" />
    </span>
  );
  // En un portal: el contenedor de la página se anima con transform y eso encerraría al fondo `fixed`.
  return createPortal(
    <div className="fixed inset-0 z-70 grid place-items-center bg-overlay p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={mensajeId}
        onKeyDown={manejarTecla}
        className="anim-dialogo grid w-full max-w-110 gap-3.5 rounded-[18px] border border-line bg-surface p-5.5 shadow-float"
      >
        <div className="flex items-center gap-3">
          {icono}
          <h2 id={tituloId} className="text-xl font-extrabold">{p.titulo}</h2>
        </div>
        <p id={mensajeId} className="text-muted">{p.mensaje}</p>
        {p.cita && <p className="rounded-[10px] bg-maize-soft px-3 py-2.5 text-[13px] text-ink [overflow-wrap:anywhere]">{p.cita}</p>}
        <div className="mt-1 flex flex-wrap justify-end gap-2.5">
          <Button ref={cancelarRef} variante="secundario" onClick={p.onCancelar} disabled={p.cargando}>{p.etiquetaCancelar ?? t('comun.cancelar')}</Button>
          <Button ref={confirmarRef} variante={p.variante ?? 'primario'} onClick={p.onConfirmar} cargando={p.cargando}>{p.etiquetaConfirmar}</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
