import { type Locale, tieneRol } from '@credito/domain';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { useT } from '../shared/i18n/I18nProvider';
import { Button } from '../shared/ui/Button';
import { ErrorBoundary } from './ErrorBoundary';
import { ENLACES } from './navegacion';

export function Layout() {
  const { t, locale, cambiarLocale } = useT();
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const enlaces = ENLACES.filter((e) => usuario && tieneRol(usuario.rol, e.roles));

  const salir = () => {
    void cerrarSesion().catch(() => undefined);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="font-semibold text-teal-800">{t('app.titulo')}</span>
          <nav className="flex flex-1 flex-wrap gap-3 text-sm">
            {enlaces.map((e) => (
              <NavLink
                key={e.ruta}
                to={e.ruta}
                end
                className={({ isActive }) => (isActive ? 'font-semibold text-teal-800' : 'text-slate-600 hover:text-slate-900')}
              >
                {t(e.clave)}
              </NavLink>
            ))}
          </nav>
          <label className="flex items-center gap-2 text-sm">
            <span>{t('nav.idioma')}</span>
            <select
              aria-label={t('nav.idioma')}
              value={locale}
              onChange={(e) => cambiarLocale(e.target.value as Locale)}
              className="rounded border border-slate-300 px-2 py-1"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
          {usuario && <span className="text-sm text-slate-600">{usuario.username} · {usuario.rol}</span>}
          <Button variante="secundario" onClick={salir}>{t('nav.salir')}</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <ErrorBoundary key={location.pathname} mensaje={t('comun.errorRender')}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
