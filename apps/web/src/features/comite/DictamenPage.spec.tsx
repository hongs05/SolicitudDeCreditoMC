import { EstadoSolicitud } from '@credito/domain';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { creditoResponse, solicitudResponse, usuarios } from '../../test/fabricas';
import { renderizar } from '../../test/render';
import { servidor } from '../../test/servidor';
import { DictamenPage } from './DictamenPage';

const pantalla = (
  <Routes>
    <Route path="/comite/:solicitudId" element={<DictamenPage />} />
    <Route path="/comite" element={<p>bandeja</p>} />
  </Routes>
);

const conSolicitud = (cambios = {}) =>
  servidor.use(http.get('/api/v1/solicitudes/5', () => HttpResponse.json(solicitudResponse(cambios))));

describe('DictamenPage', () => {
  it('muestra solo los siete campos del enunciado', async () => {
    conSolicitud();
    renderizar(pantalla, { ruta: '/comite/5', usuario: usuarios.analista });
    expect(await screen.findByText('Ana López')).toBeInTheDocument();
    for (const etiqueta of ['Cédula', 'Nombre completo', 'Edad', 'Cantidad de cuotas', 'Periodicidad de pago', 'Plazo', 'Monto solicitado']) {
      expect(screen.getByText(etiqueta)).toBeInTheDocument();
    }
    expect(screen.getByText('24 cuotas quincenales')).toBeInTheDocument();
    expect(screen.queryByText('Empresa Secreta S.A.')).not.toBeInTheDocument();
    expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Cédula' })).not.toBeInTheDocument();
  });

  it('exige observaciones antes de pedir confirmación', async () => {
    conSolicitud();
    const { user } = renderizar(pantalla, { ruta: '/comite/5', usuario: usuarios.analista });
    await user.click(await screen.findByRole('button', { name: 'Aprobar crédito' }));
    expect(screen.getByText('Las observaciones son obligatorias para emitir el dictamen')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('aprueba con una sola petición aunque se haga doble clic', async () => {
    conSolicitud();
    let peticiones = 0;
    let cuerpo: unknown;
    servidor.use(http.post('/api/v1/solicitudes/5/aprobar', async ({ request }) => {
      peticiones++;
      cuerpo = await request.json();
      await new Promise((r) => setTimeout(r, 30));
      return HttpResponse.json({ solicitud: solicitudResponse({ estado: EstadoSolicitud.APROBADA }), credito: creditoResponse() });
    }));
    const { user } = renderizar(pantalla, { ruta: '/comite/5', usuario: usuarios.analista });
    await user.type(await screen.findByLabelText('Observaciones'), 'Cumple políticas');
    await user.click(screen.getByRole('button', { name: 'Aprobar crédito' }));
    const confirmar = screen.getAllByRole('button', { name: 'Aprobar crédito' })[1]!;
    await user.dblClick(confirmar);
    expect(await screen.findByText('bandeja')).toBeInTheDocument();
    expect(peticiones).toBe(1);
    expect(cuerpo).toEqual({ observaciones: 'Cumple políticas' });
    expect(screen.getByRole('status')).toHaveTextContent('Crédito CR-000001 generado correctamente');
  });

  it('una solicitud ya dictaminada no ofrece acciones', async () => {
    conSolicitud({ estado: EstadoSolicitud.APROBADA, observaciones: 'ok' });
    renderizar(pantalla, { ruta: '/comite/5', usuario: usuarios.analista });
    expect(await screen.findByText('Esta solicitud ya cuenta con un dictamen.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprobar crédito' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Observaciones')).not.toBeInTheDocument();
  });

  it('si otro analista ya la dictaminó (409), lo explica en un modal y ofrece volver a la bandeja', async () => {
    conSolicitud();
    servidor.use(http.post('/api/v1/solicitudes/5/rechazar', () => HttpResponse.json(
      { statusCode: 409, code: 'TRANSICION_INVALIDA', message: 'No es posible rechazar una solicitud en estado aprobada' },
      { status: 409 },
    )));
    const { user } = renderizar(pantalla, { ruta: '/comite/5', usuario: usuarios.analista });
    await user.type(await screen.findByLabelText('Observaciones'), 'No cumple');
    await user.click(screen.getByRole('button', { name: 'Rechazar solicitud' }));
    await user.click(screen.getAllByRole('button', { name: 'Rechazar solicitud' })[1]!);
    const modal = await screen.findByRole('dialog', { name: 'La solicitud ya fue dictaminada' });
    expect(modal).toHaveTextContent('No es posible rechazar una solicitud en estado aprobada');
    await user.click(within(modal).getByRole('button', { name: 'Volver a la bandeja' }));
    expect(await screen.findByText('bandeja')).toBeInTheDocument();
  });

  it('la confirmación cita las observaciones y el monto', async () => {
    conSolicitud();
    const { user } = renderizar(pantalla, { ruta: '/comite/5', usuario: usuarios.analista });
    await user.type(await screen.findByLabelText('Observaciones'), 'Capacidad verificada');
    expect(screen.getByText('20 / 1000')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Aprobar crédito' }));
    const dialogo = screen.getByRole('dialog');
    expect(dialogo).toHaveTextContent('Capacidad verificada');
    expect(dialogo).toHaveTextContent(/C\$ 10[,.]000[.,]00/);
    expect(dialogo).toHaveTextContent('24 cuotas quincenales');
  });

  it('una dictaminada muestra quién decidió y sus observaciones', async () => {
    conSolicitud({
      estado: EstadoSolicitud.RECHAZADA, observaciones: 'Ingresos insuficientes',
      dictaminadaPor: { id: 2, username: 'analista', rol: 'ANALISTA' }, dictaminadaEn: new Date().toISOString(),
    });
    renderizar(pantalla, { ruta: '/comite/5', usuario: usuarios.analista });
    expect(await screen.findByText('Ingresos insuficientes')).toBeInTheDocument();
    expect(screen.getByText(/Dictamen emitido por analista/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver expediente' })).toHaveAttribute('href', '/solicitudes/5');
  });

  it('un error de red ofrece reintentar, que vuelve a pedir confirmación', async () => {
    conSolicitud();
    servidor.use(http.post('/api/v1/solicitudes/5/aprobar', () => HttpResponse.error()));
    const { user } = renderizar(pantalla, { ruta: '/comite/5', usuario: usuarios.analista });
    await user.type(await screen.findByLabelText('Observaciones'), 'Ok');
    await user.click(screen.getByRole('button', { name: 'Aprobar crédito' }));
    await user.click(screen.getAllByRole('button', { name: 'Aprobar crédito' })[1]!);
    const aviso = await screen.findByRole('alert');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(within(aviso).getByRole('button', { name: 'Reintentar' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
