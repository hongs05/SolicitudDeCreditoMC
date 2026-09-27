import { ApiError } from '../api/ApiError';
import { useT } from '../i18n/I18nProvider';
import { Button } from './Button';

export interface ErrorConsultaProps {
  error: unknown;
  onReintentar(): void;
}

export function ErrorConsulta({ error, onReintentar }: ErrorConsultaProps) {
  const { t } = useT();
  const mensaje = error instanceof ApiError ? error.message : t('comun.errorGenerico');
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-6 text-center text-sm text-red-700">
      <p>{mensaje}</p>
      <Button variante="secundario" onClick={onReintentar}>{t('comun.reintentar')}</Button>
    </div>
  );
}
