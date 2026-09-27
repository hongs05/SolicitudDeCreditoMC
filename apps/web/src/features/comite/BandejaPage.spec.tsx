import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { paginado, solicitudResponse, usuarios } from '../../test/fabricas';
import { renderizar } from '../../test/render';
import { servidor } from '../../test/servidor';
import { BandejaPage } from './BandejaPage';

const haceDias = (dias: number) => new Date(Date.now() - dias * 86_400_000 - 60_000).toISOString();

describe('BandejaPage del comité', () => {
  it('lista de la más antigua a la más nueva y marca las atrasadas', async () => {
    servidor.use(http.get('/api/v1/solicitudes', () => HttpResponse.json(paginado([
      solicitudResponse({ id: 8, nombreCompleto: 'Nueva', creadaEn: haceDias(0) }),
      solicitudResponse({ id: 7, nombreCompleto: 'Vieja', creadaEn: haceDias(4) }),
    ]))));
    renderizar(<BandejaPage />, { usuario: usuarios.analista });
    const nombres = await screen.findAllByRole('link', { name: /Nueva|Vieja/ });
    expect(nombres.map((n) => n.textContent)).toEqual(['Vieja', 'Nueva']);
    expect(screen.getByText('4 días')).toHaveClass('text-rech');
    expect(screen.getByText('Hoy')).not.toHaveClass('text-rech');
    expect(screen.getByText(/2 solicitudes esperando dictamen/)).toBeInTheDocument();
  });

  it('sin pendientes muestra la bandeja al día', async () => {
    renderizar(<BandejaPage />, { usuario: usuarios.analista });
    expect(await screen.findByText('Bandeja al día')).toBeInTheDocument();
  });
});
