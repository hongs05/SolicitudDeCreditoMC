import { type KeyboardEvent, useEffect, useId, useRef } from 'react';
import { useT } from '../i18n/I18nProvider';
import { Button } from './Button';

export interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        onKeyDown={manejarTecla}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 id={tituloId} className="text-lg font-semibold">{p.titulo}</h2>
        <p className="mt-2 text-sm text-slate-700">{p.mensaje}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button ref={cancelarRef} variante="secundario" onClick={p.onCancelar} disabled={p.cargando}>{t('comun.cancelar')}</Button>
          <Button ref={confirmarRef} variante={p.variante ?? 'primario'} onClick={p.onConfirmar} cargando={p.cargando}>{p.etiquetaConfirmar}</Button>
        </div>
      </div>
    </div>
  );
}
