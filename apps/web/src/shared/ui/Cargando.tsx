import { useT } from '../i18n/I18nProvider';

export function Cargando() {
  const { t } = useT();
  return (
    <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
      <span aria-hidden="true" className="anim-giro size-4 rounded-full border-2 border-accent border-r-transparent" />
      {t('comun.cargando')}
    </p>
  );
}
