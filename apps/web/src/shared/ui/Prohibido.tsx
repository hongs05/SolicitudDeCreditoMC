import { useT } from '../i18n/I18nProvider';
import { Card } from './Card';

export function Prohibido() {
  const { t } = useT();
  return (
    <Card titulo={t('comun.prohibidoTitulo')}>
      <p className="text-sm text-slate-700">{t('comun.prohibido')}</p>
    </Card>
  );
}
