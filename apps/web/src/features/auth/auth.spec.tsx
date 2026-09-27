import { Rol } from '@credito/domain';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Layout } from '../../app/Layout';
import { renderizar } from '../../test/render';
import { servidor } from '../../test/servidor';
import { LoginPage } from './LoginPage';
import { RequireAuth } from './RequireAuth';
import { RequireRol } from './RequireRol';

const rutas = (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<RequireAuth />}>
      <Route element={<Layout />}>
        <Route path="/privado" element={<p>contenido privado</p>} />
        <Route element={<RequireRol roles={[Rol.ANALISTA]} />}>
          <Route path="/comite" element={<p>bandeja del comité</p>} />
        </Route>
      </Route>
    </Route>
  </Routes>
);

const tokens = (rol: Rol) => ({ accessToken: 'nuevo', usuario: { id: 1, username: rol.toLowerCase(), rol } });

describe('autenticación', () => {
  it('el arranque silencioso recupera la sesión sin pedir login', async () => {
    servidor.use(http.post('/api/v1/auth/refresh', () => HttpResponse.json(tokens(Rol.OFICIAL))));
    renderizar(rutas, { ruta: '/privado' });
    expect(await screen.findByText('contenido privado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Iniciar sesión' })).not.toBeInTheDocument();
  });

  it('sin sesión redirige al login y vuelve a la ruta pedida al entrar', async () => {
    servidor.use(http.post('/api/v1/auth/login', () => HttpResponse.json(tokens(Rol.OFICIAL))));
    const { user } = renderizar(rutas, { ruta: '/privado' });
    await user.type(await screen.findByLabelText('Usuario'), 'oficial');
    await user.type(screen.getByLabelText('Contraseña'), 'Demo2026!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByText('contenido privado')).toBeInTheDocument();
  });

  it('muestra el mensaje de la API ante credenciales incorrectas', async () => {
    servidor.use(http.post('/api/v1/auth/login', () => HttpResponse.json(
      { statusCode: 401, code: 'NO_AUTENTICADO', message: 'Usuario o contraseña incorrectos, o la sesión ha expirado' }, { status: 401 },
    )));
    const { user } = renderizar(rutas, { ruta: '/login' });
    await user.type(await screen.findByLabelText('Usuario'), 'x');
    await user.type(screen.getByLabelText('Contraseña'), 'y');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos, o la sesión ha expirado');
  });

  it('RequireRol muestra 403 al rol equivocado y deja pasar a ADMIN', async () => {
    renderizar(rutas, { ruta: '/comite', usuario: tokens(Rol.CAJERO).usuario });
    expect(await screen.findByText('Acceso denegado')).toBeInTheDocument();
  });

  it('ADMIN pasa cualquier restricción de rol', async () => {
    renderizar(rutas, { ruta: '/comite', usuario: tokens(Rol.ADMIN).usuario });
    expect(await screen.findByText('bandeja del comité')).toBeInTheDocument();
  });

  it('el menú solo muestra lo que el rol puede abrir', async () => {
    renderizar(rutas, { ruta: '/privado', usuario: tokens(Rol.OFICIAL).usuario });
    await screen.findByText('contenido privado');
    expect(screen.getByRole('link', { name: 'Nueva solicitud' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Comité' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plan de pagos' })).toBeInTheDocument();
  });

  it('el menú marca la página actual y muestra cuántas solicitudes esperan al comité', async () => {
    servidor.use(http.get('/api/v1/solicitudes', ({ request }) => {
      const q = new URL(request.url).searchParams;
      return HttpResponse.json({ items: [], total: q.get('estado') === 'PENDIENTE' ? 3 : 0, page: 1, pageSize: 1 });
    }));
    renderizar(rutas, { ruta: '/comite', usuario: tokens(Rol.ANALISTA).usuario });
    const comite = await screen.findByRole('link', { name: /Comité de riesgo/ });
    expect(comite).toHaveAttribute('aria-current', 'page');
    expect(await within(comite).findByText('3')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Desembolsos/ })).not.toBeInTheDocument();
  });

  it('cambiar el idioma traduce el menú', async () => {
    const { user } = renderizar(rutas, { ruta: '/privado', usuario: tokens(Rol.OFICIAL).usuario });
    await user.selectOptions(await screen.findByLabelText('Idioma'), 'en');
    expect(screen.getByRole('link', { name: 'New application' })).toBeInTheDocument();
  });

  it('cerrar sesión llama a logout, limpia la sesión y vacía la caché de queries', async () => {
    let peticionesLogout = 0;
    servidor.use(http.post('/api/v1/auth/logout', () => {
      peticionesLogout++;
      return new HttpResponse(null, { status: 204 });
    }));
    const { user, queryClient } = renderizar(rutas, { ruta: '/privado', usuario: tokens(Rol.OFICIAL).usuario });
    const limpiarSpy = vi.spyOn(queryClient, 'clear');
    await screen.findByText('contenido privado');
    await user.click(screen.getByRole('button', { name: 'Menú de oficial' }));
    await user.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));
    expect(await screen.findByLabelText('Usuario')).toBeInTheDocument();
    expect(peticionesLogout).toBe(1);
    expect(limpiarSpy).toHaveBeenCalledOnce();
  });
});
