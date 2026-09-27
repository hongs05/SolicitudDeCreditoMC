import { Rol } from '@credito/domain';
import { fireEvent, screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useT } from '../../shared/i18n/I18nProvider';
import { renderizar } from '../../test/render';
import { servidor } from '../../test/servidor';
import { NuevaSolicitudPage } from './NuevaSolicitudPage';

const oficial = { id: 1, username: 'oficial', rol: Rol.OFICIAL };

function CambiarIdioma() {
  const { cambiarLocale } = useT();
  return <button type="button" onClick={() => cambiarLocale('en')}>EN</button>;
}

const pantalla = (
  <>
    <CambiarIdioma />
    <Routes>
      <Route path="/solicitudes/nueva" element={<NuevaSolicitudPage />} />
      <Route path="/solicitudes" element={<p>listado de solicitudes</p>} />
    </Routes>
  </>
);

const TEXTOS: Record<string, string> = {
  'Nombre completo': 'Ana López',
  'Cédula': '0010101900001A',
  'Correo electrónico': 'ana@example.com',
  'Teléfono': '88887777',
  'Empresa o lugar de trabajo': 'Empresa S.A.',
  'Antigüedad laboral (años)': '5',
  'Ingreso mensual': '30000',
  'Monto solicitado': '10000',
  'Cantidad de cuotas': '12',
  'Tasa de interés anual (%)': '12',
};

async function llenar(user: UserEvent, fechaNacimiento = '1990-01-01') {
  for (const [etiqueta, valor] of Object.entries(TEXTOS)) {
    await user.type(screen.getByLabelText(etiqueta), valor);
  }
  fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: fechaNacimiento } });
  await screen.findByRole('option', { name: 'Asalariado' });
  await user.selectOptions(screen.getByLabelText('Tipo de empleo'), '1');
  await user.selectOptions(screen.getByLabelText('Periodicidad de pago'), 'MENSUAL');
}

describe('NuevaSolicitudPage', () => {
  it('muestra la cuota del caso A mientras se escribe', async () => {
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    await llenar(user);
    expect(await screen.findByText(/C\$ 888[.,]49/)).toBeInTheDocument();
    expect(screen.getByText(/C\$ 661[.,]86/)).toBeInTheDocument();
  });

  it('bloquea el envío con 81 años', async () => {
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    await llenar(user, `${new Date().getFullYear() - 81}-01-01`);
    expect(await screen.findByText('El solicitante supera la edad máxima de 80 años')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar solicitud' })).toBeDisabled();
  });

  it('muestra junto al campo los errores 400 de la API', async () => {
    servidor.use(http.post('/api/v1/solicitudes', () => HttpResponse.json({
      statusCode: 400, code: 'VALIDACION', message: 'Datos inválidos',
      details: [{ field: 'cedula', code: 'FORMATO_INVALIDO', message: 'El formato no es válido' }],
    }, { status: 400 })));
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    await llenar(user);
    await user.click(screen.getByRole('button', { name: 'Registrar solicitud' }));
    expect(await screen.findByText('El formato no es válido')).toBeInTheDocument();
    expect(screen.getByLabelText('Cédula')).toHaveAttribute('aria-invalid', 'true');
  });

  it('envía el cuerpo con el formato de la API y vuelve al listado', async () => {
    let cuerpo: unknown;
    servidor.use(http.post('/api/v1/solicitudes', async ({ request }) => {
      cuerpo = await request.json();
      return HttpResponse.json({ id: 7 }, { status: 201 });
    }));
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    await llenar(user);
    await user.click(screen.getByRole('button', { name: 'Registrar solicitud' }));
    expect(await screen.findByText('listado de solicitudes')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Solicitud 7 registrada');
    expect(cuerpo).toMatchObject({
      tipoEmpleoId: 1, antiguedadAnios: 5, cantidadCuotas: 12,
      montoSolicitado: '10000.00', tasaAnual: '12.00', ingresoMensual: '30000.00', periodicidad: 'MENSUAL',
    });
  });

  it('traduce los errores visibles al cambiar el idioma', async () => {
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    await user.click(await screen.findByRole('button', { name: 'Registrar solicitud' }));
    expect((await screen.findAllByText('Este campo es obligatorio')).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect((await screen.findAllByText('This field is required')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Este campo es obligatorio')).not.toBeInTheDocument();
  });
});
