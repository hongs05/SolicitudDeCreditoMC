import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { RUTA_INICIO } from '../../app/navegacion';
import { ApiError } from '../../shared/api/ApiError';
import { useT } from '../../shared/i18n/I18nProvider';
import { Button } from '../../shared/ui/Button';
import { Field, Input } from '../../shared/ui/Campos';
import { Card } from '../../shared/ui/Card';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const { t } = useT();
  const { usuario, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const desde = (useLocation().state as { desde?: string } | null)?.desde;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

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

  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <Card titulo={t('login.titulo')}>
        <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
          <Field id="username" etiqueta={t('login.usuario')}>
            <Input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field id="password" etiqueta={t('login.contrasena')}>
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <Button type="submit" cargando={enviando}>{t('login.entrar')}</Button>
        </form>
      </Card>
    </main>
  );
}
