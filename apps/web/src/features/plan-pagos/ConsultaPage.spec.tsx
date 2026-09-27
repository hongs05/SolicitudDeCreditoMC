import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { creditoResponse, cuotasResponse, paginado, usuarios } from '../../test/fabricas';
import { renderizar } from '../../test/render';
import { servidor } from '../../test/servidor';
import { ConsultaPage } from './ConsultaPage';

const conCreditos = (cantidad: number) =>
  servidor.use(
    http.get('/api/v1/creditos', () => HttpResponse.json(paginado(
      Array.from({ length: cantidad }, (_, i) => creditoResponse({ id: 9 + i, numero: `CR-00000${i + 1}` })),
    ))),
    http.get('/api/v1/creditos/:id/plan-pagos', () => HttpResponse.json({ credito: creditoResponse(), cuotas: cuotasResponse(12) })),
  );

async function buscar(cedula: string) {
  const { user } = renderizar(<ConsultaPage />, { usuario: usuarios.oficial });
  await user.type(screen.getByLabelText('Cédula'), cedula);
  await user.click(screen.getByRole('button', { name: 'Buscar' }));
  return user;
}

describe('ConsultaPage', () => {
  it('sin créditos lo indica', async () => {
    conCreditos(0);
    await buscar('NADA');
    expect(await screen.findByText('La cédula no tiene créditos.')).toBeInTheDocument();
  });

  it('con un crédito carga su plan directamente', async () => {
    conCreditos(1);
    await buscar('0010101900001A');
    expect(await screen.findByText('Plan de pagos')).toBeInTheDocument();
    expect(await screen.findAllByRole('row')).toHaveLength(13);
  });

  it('con varios créditos pide elegir uno', async () => {
    conCreditos(2);
    const user = await buscar('0010101900001A');
    expect(await screen.findByText('La cédula tiene varios créditos. Elige uno:')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /CR-000002/ }));
    expect(await screen.findAllByRole('row')).toHaveLength(13);
  });

  it('no muestra el plan anterior mientras carga la nueva búsqueda', async () => {
    conCreditos(1);
    const user = await buscar('0010101900001A');
    expect(await screen.findByText('Plan de pagos')).toBeInTheDocument();
    expect(await screen.findAllByRole('row')).toHaveLength(13);

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
    expect(await screen.findByText('La cédula no tiene créditos.')).toBeInTheDocument();
  });
});
