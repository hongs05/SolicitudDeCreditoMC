import { useT } from '../i18n/I18nProvider';
import { Button } from './Button';

export function Paginador({ page, pageSize, total, onCambiar }: {
  page: number; pageSize: number; total: number; onCambiar(page: number): void;
}) {
  const { t } = useT();
  const paginas = Math.max(1, Math.ceil(total / pageSize));
  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const hasta = Math.min(total, page * pageSize);
  return (
    <nav className="flex flex-wrap items-center justify-between gap-2.5 border-t border-line px-3.5 py-2.5 text-[13px] text-muted">
      <span className="flex flex-wrap gap-x-3"><span>{t('comun.rango', { desde, hasta, total })}</span><span>{t('comun.pagina', { page, total: paginas })}</span></span>
      <div className="flex gap-1.5">
        <Button variante="secundario" tamano="sm" disabled={page <= 1} onClick={() => onCambiar(page - 1)}>{t('comun.anterior')}</Button>
        <Button variante="secundario" tamano="sm" disabled={page >= paginas} onClick={() => onCambiar(page + 1)}>{t('comun.siguiente')}</Button>
      </div>
    </nav>
  );
}
