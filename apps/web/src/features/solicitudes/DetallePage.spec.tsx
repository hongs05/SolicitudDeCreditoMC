import { EstadoSolicitud, Rol } from '@credito/domain';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { creditoResponse, solicitudResponse, usuarios } from '../../test/fabricas';
import { renderizar } from '../../test/render';
import { servidor } from '../../test/servidor';
import { DetallePage } from './DetallePage';

const pantalla = (
  <Routes>
    <Route path="/solicitudes/:solicitudId" element={<DetallePage />} />
  </Routes>
);

const analista = { id: 2, username: 'analista', rol: Rol.ANALISTA };

describe('DetallePage', () => {
  it('muestra el expediente completo de una solicitud pendiente y ofrece dictaminar al analista', async () => {
    servidor.use(http.get('/api/v1/solicitudes/5', () => HttpResponse.json(solicitudResponse())));
    renderizar(pantalla, { ruta: '/solicitudes/5', usuario: usuarios.analista });
    expect(await screen.findByRole('heading', { level: 1, name: /Ana López/ })).toBeInTheDocument();
    expect(screen.getByText('Empresa Secreta S.A.')).toBeInTheDocument();
    expect(screen.getByText('Pendiente de dictamen')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Emitir dictamen' })).toHaveAttribute('href', '/comite/5');
    expect(screen.queryByRole('link', { name: 'Plan de pagos' })).not.toBeInTheDocument();
    // Cuota 528,71 quincenal sobre 30 000 de ingreso: 528,71 × 2 / 30 000 ≈ 4 %.
    expect(screen.getByText('4 %')).toBeInTheDocument();
  });

  it('el oficial no ve la acción de dictaminar', async () => {
    servidor.use(http.get('/api/v1/solicitudes/5', () => HttpResponse.json(solicitudResponse())));
    renderizar(pantalla, { ruta: '/solicitudes/5', usuario: usuarios.oficial });
    await screen.findByText('Pendiente de dictamen');
    expect(screen.queryByRole('link', { name: 'Emitir dictamen' })).not.toBeInTheDocument();
  });

  it('una solicitud desembolsada muestra el historial completo y enlaza al plan', async () => {
    servidor.use(
      http.get('/api/v1/solicitudes/5', () => HttpResponse.json(solicitudResponse({
        estado: EstadoSolicitud.DESEMBOLSADA, observaciones: 'Buen historial', creditoId: 9,
        dictaminadaPor: analista, dictaminadaEn: '2026-09-25T15:00:00.000Z',
      }))),
      http.get('/api/v1/creditos/9', () => HttpResponse.json(creditoResponse({
        estado: EstadoSolicitud.DESEMBOLSADA,
        desembolso: {
          id: 1, creditoId: 9, banco: { id: 3, codigo: 'BAC_CREDOMATIC', nombre: 'BAC Credomatic' }, numeroCuenta: '1002003004',
          ejecutadoPor: { id: 3, username: 'cajero', rol: Rol.CAJERO }, ejecutadoEn: '2026-09-26T15:00:00.000Z',
        },
      }))),
    );
    renderizar(pantalla, { ruta: '/solicitudes/5', usuario: usuarios.cajero });
    expect(await screen.findByText('Aprobada por el comité')).toBeInTheDocument();
    expect(screen.getByText('Buen historial')).toBeInTheDocument();
    expect(await screen.findByText('por analista · crédito CR-000001')).toBeInTheDocument();
    expect(await screen.findByText('por cajero · BAC Credomatic · cuenta ···3004')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plan de pagos' })).toHaveAttribute('href', '/plan-pagos?cedula=0010101900001A&credito=9');
    expect(screen.queryByRole('link', { name: 'Desembolsar' })).not.toBeInTheDocument();
  });

  it('una solicitud aprobada ofrece desembolsar al cajero', async () => {
    servidor.use(
      http.get('/api/v1/solicitudes/5', () => HttpResponse.json(solicitudResponse({ estado: EstadoSolicitud.APROBADA, creditoId: 9 }))),
      http.get('/api/v1/creditos/9', () => HttpResponse.json(creditoResponse())),
    );
    renderizar(pantalla, { ruta: '/solicitudes/5', usuario: usuarios.cajero });
    expect(await screen.findByRole('link', { name: 'Desembolsar' })).toHaveAttribute('href', '/desembolsos/9');
    expect(screen.getByText('Pendiente de desembolso en caja.')).toBeInTheDocument();
  });

  it('si la consulta falla ofrece reintentar', async () => {
    servidor.use(http.get('/api/v1/solicitudes/5', () => HttpResponse.json(
      { statusCode: 404, code: 'NO_ENCONTRADO', message: 'Solicitud no encontrado' }, { status: 404 },
    )));
    renderizar(pantalla, { ruta: '/solicitudes/5', usuario: usuarios.oficial });
    expect(await screen.findByRole('alert')).toHaveTextContent('Solicitud no encontrado');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
