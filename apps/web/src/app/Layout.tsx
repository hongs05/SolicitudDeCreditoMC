import { EstadoSolicitud, type Locale, tieneRol } from '@credito/domain';
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { useConteoCreditos } from '../shared/api/creditos';
import { useConteoSolicitudes } from '../shared/api/solicitudes';
import { useT } from '../shared/i18n/I18nProvider';
import { Icono } from '../shared/ui/Icono';
import { ErrorBoundary } from './ErrorBoundary';
import { Marca } from './Marca';
import { type Contador, ENLACES, enlaceActivo } from './navegacion';

export function Layout() {
  const { t, locale, cambiarLocale } = useT();
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [popAbierto, setPopAbierto] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  const enlaces = ENLACES.filter((e) => usuario && tieneRol(usuario.rol, e.roles));
  const activo = enlaceActivo(enlaces, location.pathname);
  const ve = (c: Contador) => enlaces.some((e) => e.contador === c);
  const pendientes = useConteoSolicitudes(EstadoSolicitud.PENDIENTE, ve('comite'));
  const aprobados = useConteoCreditos(EstadoSolicitud.APROBADA, ve('desembolsos'));
  const contadores: Record<Contador, number | undefined> = { comite: pendientes.data, desembolsos: aprobados.data };

  // Al navegar se cierran el menú móvil y el de usuario.
  useEffect(() => {
    setMenuAbierto(false);
    setPopAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!popAbierto && !menuAbierto) return;
    const cerrar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPopAbierto(false); setMenuAbierto(false); }
    };
    const fuera = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setPopAbierto(false);
    };
    document.addEventListener('keydown', cerrar);
    document.addEventListener('mousedown', fuera);
    return () => {
      document.removeEventListener('keydown', cerrar);
      document.removeEventListener('mousedown', fuera);
    };
  }, [popAbierto, menuAbierto]);

  const salir = () => {
    setPopAbierto(false);
    void cerrarSesion().catch(() => undefined);
  };

  const grupos = [...new Set(enlaces.map((e) => e.grupo))];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <header className="sticky top-0 z-40 flex items-center gap-2.5 border-b border-line bg-band px-4 py-2.5 lg:hidden">
        <button type="button" onClick={() => setMenuAbierto(true)} aria-label={t('nav.abrirMenu')} aria-expanded={menuAbierto} aria-controls="menu-lateral"
          className="grid size-9 place-items-center rounded-[10px] border border-line-strong bg-surface text-ink active:scale-95">
          <Icono nombre="menu" />
        </button>
        <Marca />
        <span className="flex-1" />
        {usuario && <span className="rounded-full bg-surface-3 px-2 py-px font-mono text-[10.5px] text-muted">{usuario.rol}</span>}
      </header>

      {menuAbierto && <div className="fixed inset-0 z-50 bg-overlay lg:hidden" onClick={() => setMenuAbierto(false)} aria-hidden="true" />}

      {/* La columna lleva el fondo para que la banda llegue al final aunque el menú sea sticky. */}
      <div className="lg:bg-band">
        <aside id="menu-lateral"
          className={`fixed inset-y-0 left-0 z-60 flex w-[min(290px,86vw)] flex-col gap-3.5 bg-band px-3 py-4.5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-auto lg:translate-x-0 ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between px-2 py-1">
            <Marca />
            <button type="button" onClick={() => setMenuAbierto(false)} aria-label={t('nav.cerrarMenu')}
              className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 lg:hidden">
              <Icono nombre="cerrar" />
            </button>
          </div>

          <nav aria-label={t('nav.principal')} className="grid gap-0.5 overflow-y-auto">
            {grupos.map((grupo) => (
              <div key={grupo} className="grid gap-0.5">
                <div className="px-2.5 pt-4 pb-1.5 text-[10.5px] font-semibold tracking-[0.12em] text-muted uppercase opacity-75">{t(grupo)}</div>
                {enlaces.filter((e) => e.grupo === grupo).map((e) => {
                  const esActivo = activo === e.ruta;
                  const cuenta = e.contador ? contadores[e.contador] : undefined;
                  return (
                    <Link key={e.ruta} to={e.ruta} aria-current={esActivo ? 'page' : undefined}
                      className={`relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] font-medium ${esActivo ? 'bg-accent-soft text-accent-strong before:absolute before:inset-y-2 before:-left-3 before:w-[3px] before:rounded-r before:bg-accent' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}>
                      <Icono nombre={e.icono} />
                      {t(e.clave)}
                      {cuenta !== undefined && (
                        <span className={`ml-auto inline-grid h-5 min-w-5 place-items-center rounded px-1.5 font-mono text-[11px] ${cuenta > 0 ? 'bg-maize text-[#3d2e00]' : 'bg-surface-3 text-muted'}`}>{cuenta}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="mt-auto grid gap-2.5">
            <div className="flex items-center gap-2 px-2 text-[12.5px] text-muted">
              <Icono nombre="idioma" />
              <span aria-hidden="true">{t('nav.idioma')}</span>
              <select aria-label={t('nav.idioma')} value={locale} onChange={(e) => cambiarLocale(e.target.value as Locale)}
                className="ml-auto rounded-full border border-line-strong bg-surface px-2 py-1 text-xs text-ink">
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            {usuario && (
              <div ref={popRef} className="relative">
                {popAbierto && (
                  <div role="menu" className="anim-dialogo absolute inset-x-0 bottom-[calc(100%+6px)] z-30 grid gap-0.5 rounded-[14px] border border-line bg-surface p-1.5 shadow-float">
                    <div className="px-2.5 pt-2 pb-1.5 text-xs text-muted">{t('nav.sesionDe', { usuario: usuario.username })}</div>
                    <hr className="my-1 border-line" />
                    <button type="button" role="menuitem" onClick={salir}
                      className="flex items-center gap-2.5 rounded px-2.5 py-2 text-left text-[13px] text-danger hover:bg-surface-2">
                      <Icono nombre="salir" /> {t('nav.salir')}
                    </button>
                  </div>
                )}
                <button type="button" onClick={() => setPopAbierto((v) => !v)} aria-haspopup="menu" aria-expanded={popAbierto}
                  aria-label={t('nav.menuUsuario', { usuario: usuario.username })}
                  className="flex w-full items-center gap-2.5 rounded-[14px] border border-line bg-surface p-2 text-left text-ink hover:bg-surface-2">
                  <span aria-hidden="true" className="grid size-7.5 place-items-center rounded-md bg-accent-soft text-xs font-bold text-accent uppercase">{usuario.username.slice(0, 2)}</span>
                  <span className="grid min-w-0 leading-tight">
                    <b className="font-semibold">{usuario.username}</b>
                    <span className="justify-self-start rounded-full bg-surface-3 px-2 py-px font-mono text-[10.5px] text-muted">{usuario.rol}</span>
                  </span>
                  <Icono nombre="chevron" className="ml-auto size-4 text-muted" />
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      <main className="mx-auto grid w-full max-w-[1200px] min-w-0 content-start gap-6 px-4 pt-5.5 pb-20 lg:px-9 lg:pt-7.5">
        <ErrorBoundary key={location.pathname} mensaje={t('comun.errorRender')} detalleTecnico={t('comun.detalleTecnico')} texto={t('comun.errorRenderTexto')} inicio={t('comun.irInicio')}>
          <div key={location.pathname} className="anim-pagina grid content-start gap-6">
            <Outlet />
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}
