import { useT } from '../i18n/I18nProvider';

export function Cargando() {
  const { t } = useT();
  return <p role="status" className="py-6 text-center text-sm text-slate-500">{t('comun.cargando')}</p>;
}
