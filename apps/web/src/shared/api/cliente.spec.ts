import { Rol } from '@credito/domain';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { servidor } from '../../test/servidor';
import { ApiError } from './ApiError';
import { crearHttpClient } from './cliente';
import { preferencias } from './preferencias';
import { sesion } from './sesion';

const usuario = { id: 1, username: 'oficial', rol: Rol.OFICIAL };
const noAutenticado = () =>
  HttpResponse.json({ statusCode: 401, code: 'NO_AUTENTICADO', message: 'x' }, { status: 401 });

describe('cliente HTTP', () => {
  it('adjunta el bearer y el idioma', async () => {
    sesion.establecer({ accessToken: 'abc', usuario });
    preferencias.fijarLocale('en');
    let cabeceras: Headers | undefined;
    servidor.use(http.get('/api/v1/eco', ({ request }) => {
      cabeceras = request.headers;
      return HttpResponse.json({ ok: true });
    }));
    await crearHttpClient().get('/eco');
    expect(cabeceras?.get('authorization')).toBe('Bearer abc');
    expect(cabeceras?.get('accept-language')).toBe('en');
    preferencias.fijarLocale('es');
  });

  it('convierte las respuestas de error en ApiError', async () => {
    servidor.use(http.post('/api/v1/eco', () => HttpResponse.json({
      statusCode: 400, code: 'VALIDACION', message: 'Datos inválidos',
      details: [{ field: 'cedula', code: 'FORMATO_INVALIDO', message: 'El formato no es válido' }],
    }, { status: 400 })));
    const error = await crearHttpClient().post('/eco', {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDACION', details: [{ field: 'cedula' }] });
  });

  it('tres 401 simultáneos disparan un solo refresh y se reintentan', async () => {
    sesion.establecer({ accessToken: 'vencido', usuario });
    let refrescos = 0;
    servidor.use(
      http.post('/api/v1/auth/refresh', async () => {
        refrescos++;
        await new Promise((r) => setTimeout(r, 20));
        return HttpResponse.json({ accessToken: 'nuevo', usuario });
      }),
      http.get('/api/v1/recurso/:n', ({ request, params }) =>
        request.headers.get('authorization') === 'Bearer nuevo'
          ? HttpResponse.json({ n: params.n })
          : noAutenticado(),
      ),
    );
    const cliente = crearHttpClient();
    const resultados = await Promise.all([1, 2, 3].map((n) => cliente.get<{ n: string }>(`/recurso/${n}`)));
    expect(resultados.map((r) => r.n)).toEqual(['1', '2', '3']);
    expect(refrescos).toBe(1);
    expect(sesion.obtener().accessToken).toBe('nuevo');
  });

  it('si el refresh falla, limpia la sesión y propaga el 401', async () => {
    sesion.establecer({ accessToken: 'vencido', usuario });
    servidor.use(http.get('/api/v1/recurso', noAutenticado));
    await expect(crearHttpClient().get('/recurso')).rejects.toMatchObject({ status: 401 });
    expect(sesion.obtener().usuario).toBeNull();
  });

  it('un login fallido no intenta refresh ni limpia la sesión', async () => {
    let refrescos = 0;
    servidor.use(
      http.post('/api/v1/auth/refresh', () => {
        refrescos++;
        return noAutenticado();
      }),
      http.post('/api/v1/auth/login', noAutenticado),
    );
    await expect(crearHttpClient().post('/auth/login', {})).rejects.toMatchObject({ status: 401 });
    expect(refrescos).toBe(0);
  });

  it('un fallo de red produce un ApiError con status 0', async () => {
    servidor.use(http.get('/api/v1/caido', () => HttpResponse.error()));
    await expect(crearHttpClient().get('/caido')).rejects.toMatchObject({ status: 0, code: 'ERROR_INTERNO' });
  });

  it('un 204 devuelve undefined', async () => {
    servidor.use(http.post('/api/v1/vacio', () => new HttpResponse(null, { status: 204 })));
    await expect(crearHttpClient().post('/vacio')).resolves.toBeUndefined();
  });
});
