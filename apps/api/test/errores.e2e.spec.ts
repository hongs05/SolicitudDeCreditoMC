import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type AppPrueba, crearAppPrueba } from './helpers/app';
import { ModuloPrueba } from './helpers/controlador-prueba';

describe('manejo de errores', () => {
  let app: AppPrueba;

  beforeAll(async () => {
    app = await crearAppPrueba([ModuloPrueba]);
  });
  afterAll(async () => {
    await app.cerrar();
  });

  it('health responde ok', async () => {
    await app.agente().get('/api/v1/health').expect(200, { status: 'ok' });
  });

  it('una ruta inexistente usa el contrato en español por defecto', async () => {
    const r = await app.agente().get('/api/v1/no-existe').expect(404);
    expect(r.body).toMatchObject({
      statusCode: 404,
      code: 'NO_ENCONTRADO',
      message: 'No se encontró el recurso',
      path: '/api/v1/no-existe',
    });
    expect(typeof r.body.timestamp).toBe('string');
  });

  it('traduce según Accept-Language y cae a español con idiomas no soportados', async () => {
    const en = await app.agente().get('/api/v1/no-existe').set('Accept-Language', 'en-US,en;q=0.9');
    expect(en.body.message).toBe('Resource not found');
    const fr = await app.agente().get('/api/v1/no-existe').set('Accept-Language', 'fr-FR');
    expect(fr.body.message).toBe('No se encontró el recurso');
  });

  it('un DomainError conserva code y params', async () => {
    const r = await app.agente().get('/api/v1/prueba/dominio').expect(404);
    expect(r.body).toMatchObject({
      code: 'NO_ENCONTRADO',
      message: 'No se encontró el crédito',
      params: { recurso: 'Credito' },
    });
  });

  it('un error inesperado responde 500 sin filtrar detalles', async () => {
    const r = await app.agente().get('/api/v1/prueba/fallo').expect(500);
    expect(r.body).toMatchObject({ code: 'ERROR_INTERNO', message: 'Ocurrió un error inesperado' });
    expect(JSON.stringify(r.body)).not.toContain('boom');
    expect(r.body.stack).toBeUndefined();
  });

  it('los campos faltantes dan REQUERIDO por campo', async () => {
    const r = await app.agente().post('/api/v1/prueba/validacion').send({}).expect(400);
    expect(r.body.code).toBe('VALIDACION');
    expect(r.body.details).toEqual(expect.arrayContaining([
      { field: 'nombre', code: 'REQUERIDO', message: 'Este campo es obligatorio' },
      { field: 'monto', code: 'REQUERIDO', message: 'Este campo es obligatorio' },
    ]));
  });

  it('interpola límites, detecta formato y rechaza campos extra', async () => {
    const r = await app.agente()
      .post('/api/v1/prueba/validacion')
      .set('Accept-Language', 'en')
      .send({ nombre: 'ab', monto: '1.234', extra: 1 })
      .expect(400);
    expect(r.body.details).toEqual(expect.arrayContaining([
      { field: 'nombre', code: 'LONGITUD_INVALIDA', message: 'Must be between 3 and 10 characters' },
      { field: 'monto', code: 'FORMATO_INVALIDO', message: 'Invalid format' },
      { field: 'extra', code: 'VALOR_NO_PERMITIDO', message: 'Value not allowed' },
    ]));
  });

  it('valida el mínimo de un decimal', async () => {
    const r = await app.agente().post('/api/v1/prueba/validacion').send({ nombre: 'abc', monto: '0' }).expect(400);
    expect(r.body.details).toEqual([{ field: 'monto', code: 'VALOR_MINIMO', message: 'El valor mínimo es 0.01' }]);
  });

  it('un JSON malformado responde 400 y no 500', async () => {
    const r = await app.agente()
      .post('/api/v1/prueba/validacion')
      .set('Content-Type', 'application/json')
      .send('{"nombre": ')
      .expect(400);
    expect(r.body.code).toBe('VALIDACION');
  });
});
