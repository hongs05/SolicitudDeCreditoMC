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
  if (!p.abierto) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="dialogo-titulo" className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 id="dialogo-titulo" className="text-lg font-semibold">{p.titulo}</h2>
        <p className="mt-2 text-sm text-slate-700">{p.mensaje}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variante="secundario" onClick={p.onCancelar} disabled={p.cargando}>{t('comun.cancelar')}</Button>
          <Button variante={p.variante ?? 'primario'} onClick={p.onConfirmar} cargando={p.cargando}>{p.etiquetaConfirmar}</Button>
        </div>
      </div>
    </div>
  );
}
