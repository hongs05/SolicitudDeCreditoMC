import { Link } from 'react-router-dom';
import { useT } from '../i18n/I18nProvider';
import { claseBoton } from './Button';
import { PaginaError } from './PaginaError';

export function Prohibido() {
  const { t } = useT();
  return (
    <PaginaError
      codigo="403" icono="candado" tono="aviso"
      titulo={t('comun.prohibidoTitulo')} texto={t('comun.prohibido')}
      acciones={<Link to="/" className={claseBoton()}>{t('comun.irInicio')}</Link>}
    />
  );
}
