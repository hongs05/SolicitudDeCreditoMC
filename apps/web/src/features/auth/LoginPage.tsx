import { Rol } from '@credito/domain';
import { type FormEvent, type KeyboardEvent, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../app/Marca';
import { RUTA_INICIO } from '../../app/navegacion';
import { ApiError } from '../../shared/api/ApiError';
import { useT } from '../../shared/i18n/I18nProvider';
import { Button } from '../../shared/ui/Button';
import { Field, Input } from '../../shared/ui/Campos';
import { Icono } from '../../shared/ui/Icono';
import { useAuth } from './AuthProvider';

/** Usuarios sembrados por la API; la contraseña de demostración está documentada en el README. */
const USUARIOS_DEMO = [Rol.OFICIAL, Rol.ANALISTA, Rol.CAJERO, Rol.ADMIN].map((rol) => ({ username: rol.toLowerCase(), rol }));
const PASSWORD_DEMO = 'Demo2026!';

export function LoginPage() {
  const { t } = useT();
  const { usuario, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const desde = (useLocation().state as { desde?: string } | null)?.desde;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [mayus, setMayus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const entrarRef = useRef<HTMLButtonElement>(null);

  if (usuario) return <Navigate to={desde ?? RUTA_INICIO[usuario.rol]} replace />;

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const u = await iniciarSesion(username, password);
      navegar(desde ?? RUTA_INICIO[u.rol], { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  };

  const revisarMayus = (e: KeyboardEvent<HTMLInputElement>) => setMayus(e.getModifierState?.('CapsLock') ?? false);

  const elegirDemo = (u: string) => {
    setUsername(u);
    setPassword(PASSWORD_DEMO);
    setError(null);
    entrarRef.current?.focus();
  };

  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <aside className="relative hidden flex-col justify-between gap-8 overflow-hidden bg-band px-12 py-9 md:flex">
        <span className="inline-flex items-center gap-2.5"><Logo /><b className="text-[17px] font-extrabold tracking-[-0.03em]">Crédito MC</b></span>
        <svg viewBox="0 0 200 100" aria-hidden="true" className="absolute top-1/2 -right-15 h-45 w-90 -translate-y-1/2 opacity-15">
          <path d="M10 70c25-46 55-49 88-24s62 22 92-26" fill="none" stroke="#fcd34d" strokeWidth="18" strokeLinecap="round" />
        </svg>
        <blockquote className="m-0 max-w-[13ch] text-[clamp(34px,3.6vw,52px)] leading-none font-extrabold tracking-[-0.045em]">
          {t('login.lema')} <em className="text-accent not-italic">{t('login.lemaResaltado')}</em>
        </blockquote>
        <div className="flex flex-wrap gap-7 text-[12.5px] text-muted">
          <span><b className="block text-xl font-bold text-ink">4</b>{t('login.roles')}</span>
          <span><b className="block text-xl font-bold text-ink">4</b>{t('login.estados')}</span>
          <span><b className="block text-xl font-bold text-ink">C$</b>{t('login.cordobas')}</span>
        </div>
      </aside>

      <main className="flex flex-col px-4 pt-4.5 pb-10">
        <div className="mx-auto flex w-full max-w-105 items-center md:hidden">
          <span className="inline-flex items-center gap-2.5"><Logo /><b className="text-[17px] font-extrabold">Crédito MC</b></span>
        </div>
        <div className="grid flex-1 place-items-center py-6">
          <div className="grid w-full max-w-100 gap-5.5">
            <form onSubmit={enviar} className="grid gap-4.5" noValidate>
              <div>
                <h1 className="text-3xl font-extrabold tracking-[-0.035em]">{t('login.saludo')}</h1>
                <p className="mt-1 text-muted">{t('login.sub')}</p>
              </div>
              {error && (
                <p role="alert" className="flex items-start gap-2.5 rounded-[10px] bg-danger-soft px-3 py-2.5 text-[13px] text-danger">
                  <Icono nombre="candado" className="mt-0.5 size-4" />{error}
                </p>
              )}
              <Field id="username" etiqueta={t('login.usuario')}>
                <Input autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} />
              </Field>
              <div className="grid gap-1.5">
                <Field id="password" etiqueta={t('login.contrasena')} adorno={
                  <button type="button" onClick={() => setVerPassword((v) => !v)}
                    aria-label={verPassword ? t('login.ocultarContrasena') : t('login.mostrarContrasena')}
                    className="rounded bg-surface-2 px-2.5 text-xs font-semibold text-muted hover:text-ink">
                    {verPassword ? t('login.ocultar') : t('login.mostrar')}
                  </button>
                }>
                  <Input type={verPassword ? 'text' : 'password'} autoComplete="current-password" value={password} className="pr-19"
                    onChange={(e) => setPassword(e.target.value)} onKeyDown={revisarMayus} onKeyUp={revisarMayus} />
                </Field>
                {mayus && <span className="flex items-center gap-1.5 text-xs text-pend"><Icono nombre="alerta" className="size-3.5" />{t('login.mayus')}</span>}
              </div>
              <Button ref={entrarRef} type="submit" tamano="lg" cargando={enviando} className="w-full">{t('login.entrar')}</Button>
            </form>

            <div className="grid gap-2.5 border-t border-dashed border-line-strong pt-5">
              <span className="text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">{t('login.demo')}</span>
              <div className="grid grid-cols-2 gap-2">
                {USUARIOS_DEMO.map((u) => (
                  <button key={u.username} type="button" onClick={() => elegirDemo(u.username)} aria-pressed={username === u.username}
                    className="grid gap-0.5 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-left text-ink transition hover:border-line-strong active:scale-[0.98] aria-pressed:border-accent aria-pressed:bg-accent-soft">
                    <b className="font-mono text-[13px] font-medium">{u.username}</b>
                    <span className="text-xs text-muted">{t(`rol.${u.rol}`)}</span>
                  </button>
                ))}
              </div>
              <p className="text-[12.5px] text-muted">{t('login.demoNota', { password: PASSWORD_DEMO })}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
