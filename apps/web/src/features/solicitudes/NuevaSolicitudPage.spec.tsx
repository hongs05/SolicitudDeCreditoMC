import { Rol } from '@credito/domain';
import { fireEvent, screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useT } from '../../shared/i18n/I18nProvider';
import { renderizar } from '../../test/render';
import { servidor } from '../../test/servidor';
import { paginado, solicitudResponse } from '../../test/fabricas';
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
      <Route path="/solicitudes/:id" element={<p>expediente de la solicitud</p>} />
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
  await user.click(screen.getByRole('radio', { name: 'Anual' }));
  await user.click(screen.getByRole('radio', { name: 'Mensual' }));
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

  it('muestra un toast cuando el error 400 no corresponde a ningún campo conocido', async () => {
    servidor.use(http.post('/api/v1/solicitudes', () => HttpResponse.json({
      statusCode: 400, code: 'VALIDACION', message: 'No se pudo procesar la solicitud',
      details: [{ field: 'otroCampo', code: 'FORMATO_INVALIDO', message: 'Campo desconocido inválido' }],
    }, { status: 400 })));
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    await llenar(user);
    await user.click(screen.getByRole('button', { name: 'Registrar solicitud' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo procesar la solicitud');
  });

  it('envía el cuerpo con el formato de la API y abre el expediente creado', async () => {
    let cuerpo: unknown;
    servidor.use(http.post('/api/v1/solicitudes', async ({ request }) => {
      cuerpo = await request.json();
      return HttpResponse.json({ id: 7 }, { status: 201 });
    }));
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    await llenar(user);
    await user.click(screen.getByRole('button', { name: 'Registrar solicitud' }));
    expect(await screen.findByText('expediente de la solicitud')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Solicitud #0007 registrada');
    expect(cuerpo).toMatchObject({
      tipoEmpleoId: 1, antiguedadAnios: 5, cantidadCuotas: 12,
      montoSolicitado: '10000.00', tasaAnual: '12.00', ingresoMensual: '30000.00', periodicidad: 'MENSUAL',
    });
  });

  it('traduce el error de un campo tocado al cambiar el idioma antes de enviar', async () => {
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    const cedula = screen.getByLabelText('Cédula');
    await user.click(cedula);
    fireEvent.blur(cedula);
    expect(await screen.findByText('Este campo es obligatorio')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(await screen.findByText('This field is required')).toBeInTheDocument();
    expect(screen.queryByText('Este campo es obligatorio')).not.toBeInTheDocument();
  });

  it('traduce los errores visibles al cambiar el idioma', async () => {
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    await user.click(await screen.findByRole('button', { name: 'Registrar solicitud' }));
    expect((await screen.findAllByText('Este campo es obligatorio')).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect((await screen.findAllByText('This field is required')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Este campo es obligatorio')).not.toBeInTheDocument();
  });

  it('avisa, sin bloquear, si la cédula ya tiene una solicitud pendiente', async () => {
    servidor.use(http.get('/api/v1/solicitudes', ({ request }) => HttpResponse.json(
      new URL(request.url).searchParams.get('cedula') === '0010101900001A' ? paginado([solicitudResponse({ id: 3 })]) : paginado([]),
    )));
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    await llenar(user);
    expect(await screen.findByText('Esta cédula ya tiene la solicitud #0003 pendiente de dictamen.', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar solicitud' })).toBeEnabled();
  });

  it('advierte cuando la cuota pasa del 40 % del ingreso', async () => {
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    await llenar(user);
    await user.clear(screen.getByLabelText('Ingreso mensual'));
    await user.type(screen.getByLabelText('Ingreso mensual'), '2000');
    expect(await screen.findByText('La cuota equivale al 44 % del ingreso mensual (más del 40 %).')).toBeInTheDocument();
  });

  it('Llenar con ejemplo completa el formulario y Limpiar pide confirmación', async () => {
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    await screen.findByRole('option', { name: 'Asalariado' });
    await user.click(screen.getByRole('button', { name: 'Llenar con ejemplo' }));
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Mariela Esperanza Guevara Ortiz');
    expect(screen.getByLabelText('Tipo de empleo')).toHaveValue('1');
    await user.click(screen.getByRole('button', { name: 'Limpiar' }));
    const dialogo = screen.getByRole('dialog');
    await user.click(within(dialogo).getByRole('button', { name: 'Limpiar' }));
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('');
    expect(screen.getByRole('radio', { name: 'Mensual' })).toBeChecked();
  });

  it('un error de red al registrar ofrece reintentar', async () => {
    let intentos = 0;
    servidor.use(http.post('/api/v1/solicitudes', () => {
      intentos++;
      return intentos === 1 ? HttpResponse.error() : HttpResponse.json({ id: 8 }, { status: 201 });
    }));
    const { user } = renderizar(pantalla, { ruta: '/solicitudes/nueva', usuario: oficial });
    await llenar(user);
    await user.click(screen.getByRole('button', { name: 'Registrar solicitud' }));
    await user.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('expediente de la solicitud')).toBeInTheDocument();
    expect(intentos).toBe(2);
  });
});
