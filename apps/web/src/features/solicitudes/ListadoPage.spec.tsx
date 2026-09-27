import { EstadoSolicitud } from '@credito/domain';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { paginado, solicitudResponse, usuarios } from '../../test/fabricas';
import { renderizar } from '../../test/render';
import { servidor } from '../../test/servidor';
import { ListadoPage } from './ListadoPage';

describe('ListadoPage', () => {
  it('lista, filtra por estado y cédula, y solo ofrece crear al oficial', async () => {
    const urls: string[] = [];
    servidor.use(http.get('/api/v1/solicitudes', ({ request }) => {
      urls.push(new URL(request.url).search);
      return HttpResponse.json(paginado([solicitudResponse()]));
    }));
    const { user } = renderizar(<ListadoPage />, { usuario: usuarios.oficial });
    expect(await screen.findByText('Ana López')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nueva solicitud' })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Estado'), EstadoSolicitud.PENDIENTE);
    await user.type(screen.getByLabelText('Cédula'), 'ABC123');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByText('Ana López');
    expect(urls.at(-1)).toBe('?estado=PENDIENTE&cedula=ABC123&page=1');
  });

  it('el analista no ve el botón de crear', async () => {
    servidor.use(http.get('/api/v1/solicitudes', () => HttpResponse.json(paginado([]))));
    renderizar(<ListadoPage />, { usuario: usuarios.analista });
    expect(await screen.findByText('No hay resultados')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Nueva solicitud' })).not.toBeInTheDocument();
  });

  it('si la consulta falla muestra el error y Reintentar la repite', async () => {
    let peticiones = 0;
    servidor.use(http.get('/api/v1/solicitudes', () => {
      peticiones++;
      return peticiones === 1
        ? HttpResponse.json({ statusCode: 500, code: 'ERROR_INTERNO', message: 'Falló el servidor' }, { status: 500 })
        : HttpResponse.json(paginado([solicitudResponse()]));
    }));
    const { user } = renderizar(<ListadoPage />, { usuario: usuarios.oficial });
    expect(await screen.findByRole('alert')).toHaveTextContent('Falló el servidor');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.queryByText('No hay resultados')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Ana López')).toBeInTheDocument();
    expect(peticiones).toBe(2);
  });
});
