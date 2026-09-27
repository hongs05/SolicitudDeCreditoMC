import { ApiError } from '../api/ApiError';
import { useT } from '../i18n/I18nProvider';
import { Button } from './Button';
import { Icono } from './Icono';

export interface ErrorConsultaProps {
  error: unknown;
  onReintentar(): void;
}

export function ErrorConsulta({ error, onReintentar }: ErrorConsultaProps) {
  const { t } = useT();
  const mensaje = error instanceof ApiError ? error.message : t('comun.errorGenerico');
  return (
    <div role="alert" className="grid justify-items-center gap-3 px-5 py-10 text-center text-sm">
      <span className="grid size-11 place-items-center rounded-[10px] bg-danger-soft text-danger"><Icono nombre="alerta" className="size-5" /></span>
      <p className="text-danger">{mensaje}</p>
      <Button variante="secundario" tamano="sm" onClick={onReintentar}>{t('comun.reintentar')}</Button>
    </div>
  );
}
