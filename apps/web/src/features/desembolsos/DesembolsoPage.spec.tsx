import { EstadoSolicitud, Rol } from '@credito/domain';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { creditoResponse, cuotasResponse, usuarios } from '../../test/fabricas';
import { renderizar } from '../../test/render';
import { servidor } from '../../test/servidor';
import { DesembolsoPage } from './DesembolsoPage';

const pantalla = (
  <Routes>
    <Route path="/desembolsos/:creditoId" element={<DesembolsoPage />} />
  </Routes>
);

const desembolso = {
  id: 1, creditoId: 9, banco: { id: 3, codigo: 'BAC_CREDOMATIC', nombre: 'BAC Credomatic' },
  numeroCuenta: '1002003004', ejecutadoPor: { id: 3, username: 'cajero', rol: Rol.CAJERO },
  ejecutadoEn: '2026-09-24T18:00:00.000Z',
};

describe('DesembolsoPage', () => {
  it('desembolsa un crédito aprobado y muestra el plan', async () => {
    let estado = EstadoSolicitud.APROBADA;
    let cuerpo: unknown;
    servidor.use(
      http.get('/api/v1/creditos/9', () => HttpResponse.json(creditoResponse({
        estado, desembolso: estado === EstadoSolicitud.DESEMBOLSADA ? desembolso : null,
      }))),
      http.get('/api/v1/creditos/9/plan-pagos', () => HttpResponse.json({ credito: creditoResponse(), cuotas: cuotasResponse(12) })),
      http.post('/api/v1/desembolsos', async ({ request }) => {
        cuerpo = await request.json();
        estado = EstadoSolicitud.DESEMBOLSADA;
        return HttpResponse.json(desembolso, { status: 201 });
      }),
    );
    const { user } = renderizar(pantalla, { ruta: '/desembolsos/9', usuario: usuarios.cajero });

    expect(await screen.findByText('Desembolso del crédito CR-000001')).toBeInTheDocument();
    for (const etiqueta of ['Cédula', 'Nombre completo', 'Monto', 'Tasa', 'Periodicidad de pago', 'Plazo']) {
      expect(screen.getByText(etiqueta)).toBeInTheDocument();
    }
    expect(screen.getByText('12 cuotas mensuales')).toBeInTheDocument();

    await screen.findByRole('option', { name: 'BAC Credomatic' });
    await user.selectOptions(screen.getByLabelText('Banco destino'), '3');
    await user.type(screen.getByLabelText('Número de cuenta'), '12-34');
    await user.click(screen.getByRole('button', { name: 'Procesar desembolso' }));
    expect(screen.getByText('El formato no es válido')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Número de cuenta'));
    await user.type(screen.getByLabelText('Número de cuenta'), '1002003004');
    await user.click(screen.getByRole('button', { name: 'Procesar desembolso' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('BAC Credomatic');
    await user.click(screen.getAllByRole('button', { name: 'Procesar desembolso' })[1]!);

    expect(await screen.findByText('Desembolso realizado')).toBeInTheDocument();
    expect(cuerpo).toEqual({ creditoId: 9, bancoId: 3, numeroCuenta: '1002003004' });
    expect(await screen.findAllByRole('row')).toHaveLength(13);
    expect(screen.queryByRole('button', { name: 'Procesar desembolso' })).not.toBeInTheDocument();
  });

  it('un crédito ya desembolsado no muestra el formulario', async () => {
    servidor.use(
      http.get('/api/v1/creditos/9', () => HttpResponse.json(creditoResponse({ estado: EstadoSolicitud.DESEMBOLSADA, desembolso }))),
      http.get('/api/v1/creditos/9/plan-pagos', () => HttpResponse.json({ credito: creditoResponse(), cuotas: cuotasResponse(12) })),
    );
    renderizar(pantalla, { ruta: '/desembolsos/9', usuario: usuarios.cajero });
    expect(await screen.findByText('Desembolso realizado')).toBeInTheDocument();
    expect(screen.getByText('1002003004')).toBeInTheDocument();
    expect(screen.queryByLabelText('Banco destino')).not.toBeInTheDocument();
    expect(await screen.findAllByRole('row')).toHaveLength(13);
  });

  it('muestra el error 400 de numeroCuenta o bancoId junto al campo, no en un toast', async () => {
    servidor.use(
      http.get('/api/v1/creditos/9', () => HttpResponse.json(creditoResponse())),
      http.post('/api/v1/desembolsos', () => HttpResponse.json({
        statusCode: 400, code: 'VALIDACION', message: 'Datos inválidos',
        details: [{ field: 'numeroCuenta', code: 'CUENTA_INVALIDA', message: 'La cuenta no pertenece al banco' }],
      }, { status: 400 })));
    const { user } = renderizar(pantalla, { ruta: '/desembolsos/9', usuario: usuarios.cajero });
    await screen.findByRole('option', { name: 'LAFISE' });
    await user.selectOptions(screen.getByLabelText('Banco destino'), '1');
    await user.type(screen.getByLabelText('Número de cuenta'), '1002003004');
    await user.click(screen.getByRole('button', { name: 'Procesar desembolso' }));
    await user.click(screen.getAllByRole('button', { name: 'Procesar desembolso' })[1]!);
    expect(await screen.findByText('La cuenta no pertenece al banco')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra el error de negocio y deja el formulario', async () => {
    servidor.use(
      http.get('/api/v1/creditos/9', () => HttpResponse.json(creditoResponse())),
      http.post('/api/v1/desembolsos', () => HttpResponse.json(
        { statusCode: 409, code: 'CREDITO_YA_DESEMBOLSADO', message: 'El crédito ya fue desembolsado' }, { status: 409 },
      )),
    );
    const { user } = renderizar(pantalla, { ruta: '/desembolsos/9', usuario: usuarios.cajero });
    await screen.findByRole('option', { name: 'LAFISE' });
    await user.selectOptions(screen.getByLabelText('Banco destino'), '1');
    await user.type(screen.getByLabelText('Número de cuenta'), '1002003004');
    await user.click(screen.getByRole('button', { name: 'Procesar desembolso' }));
    await user.click(screen.getAllByRole('button', { name: 'Procesar desembolso' })[1]!);
    expect(await screen.findByRole('alert')).toHaveTextContent('El crédito ya fue desembolsado');
  });
});
