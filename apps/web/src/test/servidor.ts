import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const manejadoresBase = [
  http.post('/api/v1/auth/refresh', () =>
    HttpResponse.json({ statusCode: 401, code: 'NO_AUTENTICADO', message: 'Sin sesión' }, { status: 401 }),
  ),
  http.get('/api/v1/tipos-empleo', () =>
    HttpResponse.json([
      { id: 1, codigo: 'ASALARIADO', nombre: 'Asalariado' },
      { id: 2, codigo: 'INDEPENDIENTE', nombre: 'Independiente' },
    ]),
  ),
  http.get('/api/v1/bancos', () =>
    HttpResponse.json([
      { id: 1, codigo: 'LAFISE', nombre: 'LAFISE' },
      { id: 2, codigo: 'FICOHSA', nombre: 'FICOHSA' },
      { id: 3, codigo: 'BAC_CREDOMATIC', nombre: 'BAC Credomatic' },
      { id: 4, codigo: 'BANPRO', nombre: 'Banpro' },
    ]),
  ),
];

export const servidor = setupServer(...manejadoresBase);
