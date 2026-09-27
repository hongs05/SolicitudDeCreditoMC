import { type KeyboardEvent, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../i18n/I18nProvider';
import { Button } from './Button';

export interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  /** Texto citado debajo del mensaje, como las observaciones o el banco y la cuenta. */
  cita?: string;
  etiquetaConfirmar: string;
  variante?: 'primario' | 'peligro';
  cargando?: boolean;
  onConfirmar(): void;
  onCancelar(): void;
}

export function ConfirmDialog(p: ConfirmDialogProps) {
  const { t } = useT();
  const tituloId = useId();
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

  const borde = p.variante === 'peligro' ? 'border-t-danger' : 'border-t-accent';
  // En un portal: el contenedor de la página se anima con transform y eso encerraría al fondo `fixed`.
  return createPortal(
    <div className="fixed inset-0 z-70 grid place-items-center bg-overlay p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        onKeyDown={manejarTecla}
        className={`anim-dialogo grid w-full max-w-110 gap-3.5 rounded-[10px] border border-line border-t-4 bg-surface p-5.5 shadow-float ${borde}`}
      >
        <h2 id={tituloId} className="text-xl font-extrabold">{p.titulo}</h2>
        <p className="text-muted">{p.mensaje}</p>
        {p.cita && <p className="rounded-[10px] border-l-[3px] border-maize bg-surface-2 px-3 py-2.5 text-[13px] text-ink [overflow-wrap:anywhere]">{p.cita}</p>}
        <div className="mt-1 flex flex-wrap justify-end gap-2.5">
          <Button ref={cancelarRef} variante="secundario" onClick={p.onCancelar} disabled={p.cargando}>{t('comun.cancelar')}</Button>
          <Button ref={confirmarRef} variante={p.variante ?? 'primario'} onClick={p.onConfirmar} cargando={p.cargando}>{p.etiquetaConfirmar}</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
