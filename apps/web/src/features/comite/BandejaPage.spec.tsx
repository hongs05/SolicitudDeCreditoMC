import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { paginado, solicitudResponse, usuarios } from '../../test/fabricas';
import { renderizar } from '../../test/render';
import { servidor } from '../../test/servidor';
import { BandejaPage } from './BandejaPage';

const haceDias = (dias: number) => new Date(Date.now() - dias * 86_400_000 - 60_000).toISOString();

describe('BandejaPage del comité', () => {
  it('pide a la API las más antiguas primero, las lista en ese orden y marca las atrasadas', async () => {
    const pedidas: URLSearchParams[] = [];
    servidor.use(http.get('/api/v1/solicitudes', ({ request }) => {
      pedidas.push(new URL(request.url).searchParams);
      return HttpResponse.json(paginado([
        solicitudResponse({ id: 7, nombreCompleto: 'Vieja', creadaEn: haceDias(4) }),
        solicitudResponse({ id: 8, nombreCompleto: 'Nueva', creadaEn: haceDias(0) }),
      ]));
    }));
    renderizar(<BandejaPage />, { usuario: usuarios.analista });
    const nombres = await screen.findAllByRole('link', { name: /Nueva|Vieja/ });
    expect(nombres.map((n) => n.textContent)).toEqual(['Vieja', 'Nueva']);
    expect(pedidas.some((q) => q.get('estado') === 'PENDIENTE' && q.get('orden') === 'asc')).toBe(true);
    expect(screen.getByText('4 días')).toHaveClass('text-rech');
    expect(screen.getByText('Hoy')).not.toHaveClass('text-rech');
    expect(await screen.findByText(/2 solicitudes pendientes de dictamen/)).toBeInTheDocument();
  });

  it('en la página 2 el subtítulo sigue nombrando la más antigua de toda la bandeja', async () => {
    const vieja = solicitudResponse({ id: 1, nombreCompleto: 'Primera', creadaEn: haceDias(10) });
    servidor.use(http.get('/api/v1/solicitudes', ({ request }) => {
      const q = new URL(request.url).searchParams;
      if (q.get('pageSize') === '1') return HttpResponse.json({ items: [vieja], total: 21, page: 1, pageSize: 1 });
      const page = Number(q.get('page'));
      const items = page === 1
        ? Array.from({ length: 20 }, (_, i) => solicitudResponse({ id: i + 1, nombreCompleto: `P1-${i}`, creadaEn: haceDias(10) }))
        : [solicitudResponse({ id: 21, nombreCompleto: 'Reciente', creadaEn: haceDias(0) })];
      return HttpResponse.json({ items, total: 21, page, pageSize: 20 });
    }));
    const { user } = renderizar(<BandejaPage />, { usuario: usuarios.analista });
    await user.click(await screen.findByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByRole('link', { name: 'Reciente' })).toBeInTheDocument();
    expect(screen.getByText(/21 solicitudes pendientes de dictamen\. La más antigua ingresó hace 10 días/)).toBeInTheDocument();
  });

  it('sin pendientes muestra la bandeja al día', async () => {
    renderizar(<BandejaPage />, { usuario: usuarios.analista });
    expect(await screen.findByText('Sin solicitudes pendientes')).toBeInTheDocument();
  });
});
