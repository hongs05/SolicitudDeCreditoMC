import { useT } from '../i18n/I18nProvider';
import { Button } from './Button';

export function Paginador({ page, pageSize, total, onCambiar }: {
  page: number; pageSize: number; total: number; onCambiar(page: number): void;
}) {
  const { t } = useT();
  const paginas = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav className="mt-4 flex items-center justify-between text-sm">
      <Button variante="secundario" disabled={page <= 1} onClick={() => onCambiar(page - 1)}>{t('comun.anterior')}</Button>
      <span>{t('comun.pagina', { page, total: paginas })}</span>
      <Button variante="secundario" disabled={page >= paginas} onClick={() => onCambiar(page + 1)}>{t('comun.siguiente')}</Button>
    </nav>
  );
}
