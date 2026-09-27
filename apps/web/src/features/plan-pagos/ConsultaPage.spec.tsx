import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Link, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { creditoResponse, cuotasResponse, paginado, solicitudResponse, usuarios } from '../../test/fabricas';
import { renderizar } from '../../test/render';
import { servidor } from '../../test/servidor';
import { ConsultaPage } from './ConsultaPage';

const conCreditos = (cantidad: number) =>
  servidor.use(
    http.get('/api/v1/creditos', () => HttpResponse.json(paginado(
      Array.from({ length: cantidad }, (_, i) => creditoResponse({ id: 9 + i, numero: `CR-00000${i + 1}` })),
    ))),
    http.get('/api/v1/creditos/:id/plan-pagos', () => HttpResponse.json({ credito: creditoResponse(), cuotas: cuotasResponse(12) })),
    http.get('/api/v1/creditos/:id', () => HttpResponse.json(creditoResponse())),
  );

async function buscar(cedula: string) {
  const { user } = renderizar(<ConsultaPage />, { usuario: usuarios.oficial });
  await user.type(screen.getByLabelText('Cédula'), cedula);
  await user.click(screen.getByRole('button', { name: 'Buscar' }));
  return user;
}

/** La página con enlaces que cambian solo la query, como el menú lateral o Atrás/Adelante, y la URL visible. */
function ConNavegacion() {
  const { search } = useLocation();
  return (
    <>
      <ConsultaPage />
      <Link to="/plan-pagos">Ir sin cédula</Link>
      <Link to="/plan-pagos?cedula=OTRA">Ir a OTRA</Link>
      <output aria-label="URL">{search}</output>
    </>
  );
}

describe('ConsultaPage', () => {
  it('sin créditos lo indica', async () => {
    conCreditos(0);
    await buscar('NADA');
    expect(await screen.findByText('No se encontraron créditos asociados a esta cédula.')).toBeInTheDocument();
    expect(screen.getByText('Verifique que la cédula coincida con la registrada en la solicitud.')).toBeInTheDocument();
  });

  it('sin créditos pero con solicitud explica por qué no hay plan', async () => {
    conCreditos(0);
    servidor.use(http.get('/api/v1/solicitudes', () => HttpResponse.json(paginado([solicitudResponse()]))));
    await buscar('0010101900001A');
    expect(await screen.findByText(/Existe una solicitud a nombre de Ana López en estado pendiente/)).toBeInTheDocument();
  });

  it('llega desde el expediente con la cédula y el crédito en la URL', async () => {
    conCreditos(2);
    renderizar(<ConsultaPage />, { ruta: '/plan-pagos?cedula=0010101900001A&credito=10', usuario: usuarios.oficial });
    expect(await screen.findByRole('button', { name: /CR-000002/ })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findAllByRole('row')).toHaveLength(14);
    expect(screen.getByLabelText('Cédula')).toHaveValue('0010101900001A');
  });

  it('con un crédito carga su plan directamente', async () => {
    conCreditos(1);
    await buscar('0010101900001A');
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(await screen.findAllByRole('row')).toHaveLength(14);
    expect(await screen.findByText('12 % anual · 12 cuotas mensuales')).toBeInTheDocument();
  });

  it('con varios créditos pide elegir uno', async () => {
    conCreditos(2);
    const user = await buscar('0010101900001A');
    expect(await screen.findByText('Ana López tiene 2 créditos')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /CR-000002/ }));
    expect(await screen.findAllByRole('row')).toHaveLength(14);
  });

  it('no muestra el plan anterior mientras carga la nueva búsqueda', async () => {
    conCreditos(1);
    const user = await buscar('0010101900001A');
    expect(await screen.findAllByRole('row')).toHaveLength(14);

    servidor.use(
      http.get('/api/v1/creditos', async () => {
        await new Promise((r) => setTimeout(r, 50));
        return HttpResponse.json(paginado([]));
      }),
    );
    await user.clear(screen.getByLabelText('Cédula'));
    await user.type(screen.getByLabelText('Cédula'), 'OTRA');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(await screen.findByText('No se encontraron créditos asociados a esta cédula.')).toBeInTheDocument();
  });

  it('el campo y el crédito elegido siguen a la URL cuando cambia sin desmontar la página', async () => {
    conCreditos(2);
    const { user } = renderizar(<ConNavegacion />, { ruta: '/plan-pagos?cedula=0010101900001A&credito=10', usuario: usuarios.oficial });
    expect(await screen.findAllByRole('row')).toHaveLength(14);

    await user.click(screen.getByRole('link', { name: 'Ir a OTRA' }));
    expect(screen.getByLabelText('Cédula')).toHaveValue('OTRA');
    expect(await screen.findByText('Ana López tiene 2 créditos')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Ir sin cédula' }));
    expect(screen.getByLabelText('Cédula')).toHaveValue('');
    expect(screen.queryByText('Ana López tiene 2 créditos')).not.toBeInTheDocument();
  });

  it('guarda en la URL el crédito elegido', async () => {
    conCreditos(2);
    const { user } = renderizar(<ConNavegacion />, { ruta: '/plan-pagos', usuario: usuarios.oficial });
    await user.type(screen.getByLabelText('Cédula'), '0010101900001A');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await user.click(await screen.findByRole('button', { name: /CR-000002/ }));
    expect(screen.getByLabelText('URL')).toHaveTextContent('?cedula=0010101900001A&credito=10');
  });
});
