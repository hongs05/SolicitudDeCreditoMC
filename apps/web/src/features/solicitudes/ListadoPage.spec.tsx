import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { paginado, solicitudResponse, usuarios } from '../../test/fabricas';
import { renderizar } from '../../test/render';
import { servidor } from '../../test/servidor';
import { ListadoPage } from './ListadoPage';

describe('ListadoPage', () => {
  it('lista, filtra por estado y cédula, y solo ofrece crear al oficial', async () => {
    const urls: string[] = [];
    servidor.use(http.get('/api/v1/solicitudes', ({ request }) => {
      const url = new URL(request.url);
      // Las tarjetas piden solo el total (pageSize=1); se registran aparte del listado.
      if (url.searchParams.get('pageSize') === '1') {
        return HttpResponse.json({ items: [], total: url.searchParams.get('estado') === 'PENDIENTE' ? 4 : 9, page: 1, pageSize: 1 });
      }
      urls.push(url.search);
      return HttpResponse.json(paginado([solicitudResponse()]));
    }));
    const { user } = renderizar(<ListadoPage />, { usuario: usuarios.oficial });
    expect(await screen.findByText('Ana López')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nueva solicitud' })).toBeInTheDocument();

    const pendientes = screen.getByRole('button', { name: /Pendientes/ });
    expect(await within(pendientes).findByText('4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Todas/ })).toHaveAttribute('aria-pressed', 'true');
    await user.click(pendientes);
    expect(pendientes).toHaveAttribute('aria-pressed', 'true');
    await user.type(screen.getByLabelText('Cédula'), 'ABC123');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByText('Ana López');
    expect(urls.at(-1)).toBe('?estado=PENDIENTE&cedula=ABC123&page=1');
  });

  it('abrir una fila lleva al expediente', async () => {
    servidor.use(http.get('/api/v1/solicitudes', () => HttpResponse.json(paginado([solicitudResponse()]))));
    const { user } = renderizar(
      <Routes>
        <Route path="/solicitudes" element={<ListadoPage />} />
        <Route path="/solicitudes/:id" element={<p>expediente</p>} />
      </Routes>,
      { ruta: '/solicitudes', usuario: usuarios.analista },
    );
    await user.click(await screen.findByText('#0005'));
    expect(await screen.findByText('expediente')).toBeInTheDocument();
  });

  it('el analista no ve el botón de crear', async () => {
    servidor.use(http.get('/api/v1/solicitudes', () => HttpResponse.json(paginado([]))));
    renderizar(<ListadoPage />, { usuario: usuarios.analista });
    expect(await screen.findByText('No se encontraron resultados')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Nueva solicitud' })).not.toBeInTheDocument();
  });

  it('si la consulta falla muestra el error y Reintentar la repite', async () => {
    let peticiones = 0;
    servidor.use(http.get('/api/v1/solicitudes', ({ request }) => {
      if (new URL(request.url).searchParams.get('pageSize') === '1') return HttpResponse.json(paginado([]));
      peticiones++;
      return peticiones === 1
        ? HttpResponse.json({ statusCode: 500, code: 'ERROR_INTERNO', message: 'Falló el servidor' }, { status: 500 })
        : HttpResponse.json(paginado([solicitudResponse()]));
    }));
    const { user } = renderizar(<ListadoPage />, { usuario: usuarios.oficial });
    expect(await screen.findByRole('alert')).toHaveTextContent('Falló el servidor');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.queryByText('No se encontraron resultados')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Ana López')).toBeInTheDocument();
    expect(peticiones).toBe(2);
  });
});
