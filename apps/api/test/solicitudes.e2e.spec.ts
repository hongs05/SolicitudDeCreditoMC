import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type AppPrueba, crearAppPrueba } from './helpers/app';
import { cuerpoSolicitud, fechaHaceAnios } from './helpers/cuerpos';
import { iniciarSesion } from './helpers/sesiones';

describe('solicitudes', () => {
  let app: AppPrueba;
  let oficial: string;
  let analista: string;

  const como = (token: string) => ({
    get: (ruta: string) => app.agente().get(ruta).set('Authorization', `Bearer ${token}`),
    post: (ruta: string, cuerpo: object = {}) =>
      app.agente().post(ruta).set('Authorization', `Bearer ${token}`).send(cuerpo),
  });
  const crear = async (cambios = {}) =>
    (await como(oficial).post('/api/v1/solicitudes', cuerpoSolicitud(cambios)).expect(201)).body.id as number;

  beforeAll(async () => {
    app = await crearAppPrueba();
    ({ accessToken: oficial } = await iniciarSesion(app, 'oficial'));
    ({ accessToken: analista } = await iniciarSesion(app, 'analista'));
  });
  afterAll(async () => {
    await app.cerrar();
  });

  it('lista los tipos de empleo', async () => {
    const r = await como(oficial).get('/api/v1/tipos-empleo').expect(200);
    expect(r.body.map((t: { codigo: string }) => t.codigo)).toEqual(['ASALARIADO', 'INDEPENDIENTE']);
  });

  it('crea una solicitud y la devuelve con edad y cuota', async () => {
    const r = await como(oficial).post('/api/v1/solicitudes', cuerpoSolicitud()).expect(201);
    expect(r.body).toMatchObject({
      estado: 'PENDIENTE',
      montoSolicitado: '10000.00',
      tasaAnual: '12.00',
      ingresoMensual: '30000.00',
      cuotaNivelada: '888.49',
      tipoEmpleo: { codigo: 'ASALARIADO' },
      observaciones: null,
      dictaminadaPor: null,
      creditoId: null,
    });
    expect(r.body.edad).toBeGreaterThanOrEqual(36);
  });

  it('valida el cuerpo campo por campo en el idioma pedido', async () => {
    const r = await app.agente()
      .post('/api/v1/solicitudes')
      .set('Authorization', `Bearer ${oficial}`)
      .set('Accept-Language', 'en')
      .send(cuerpoSolicitud({ correo: undefined, montoSolicitado: '12,5', cantidadCuotas: 361, extra: true }))
      .expect(400);
    expect(r.body.details).toEqual(expect.arrayContaining([
      { field: 'correo', code: 'REQUERIDO', message: 'This field is required' },
      { field: 'montoSolicitado', code: 'FORMATO_INVALIDO', message: 'Invalid format' },
      { field: 'cantidadCuotas', code: 'VALOR_MAXIMO', message: 'Maximum value is 360' },
      { field: 'extra', code: 'VALOR_NO_PERMITIDO', message: 'Value not allowed' },
    ]));
  });

  it('recorta espacios antes de validar y rechaza campos que quedan vacíos', async () => {
    const r = await como(oficial)
      .post('/api/v1/solicitudes', cuerpoSolicitud({ nombreCompleto: '   ', empresa: ' a ' }))
      .expect(400);
    expect(r.body.details).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'nombreCompleto', code: 'REQUERIDO' }),
      expect.objectContaining({ field: 'empresa', code: 'LONGITUD_INVALIDA' }),
    ]));
  });

  it('trata los filtros vacíos como ausentes', async () => {
    await crear({ cedula: 'FILTRO-VACIO' });
    const r = await como(analista).get('/api/v1/solicitudes?estado=&cedula=').expect(200);
    expect(r.body.total).toBeGreaterThanOrEqual(1);
  });

  it.each([['2026-02-30'], ['2999-01-01'], ['01/01/1990']])('rechaza la fecha de nacimiento %s', async (fecha) => {
    const r = await como(oficial).post('/api/v1/solicitudes', cuerpoSolicitud({ fechaNacimiento: fecha })).expect(400);
    expect(r.body.details).toEqual([expect.objectContaining({ field: 'fechaNacimiento', code: 'FECHA_INVALIDA' })]);
  });

  it('rechaza mayores de 80 años con 422', async () => {
    const r = await como(oficial)
      .post('/api/v1/solicitudes', cuerpoSolicitud({ fechaNacimiento: fechaHaceAnios(82) }))
      .expect(422);
    expect(r.body).toMatchObject({ code: 'EDAD_MAXIMA_EXCEDIDA' });
    expect(r.body.message).toMatch(/la edad máxima permitida es 80/);
  });

  it('no admite dos solicitudes abiertas con la misma cédula (409 con el id y el estado)', async () => {
    const primera = await crear({ cedula: 'DUPLICADA-1' });
    const r = await como(oficial).post('/api/v1/solicitudes', cuerpoSolicitud({ cedula: 'DUPLICADA-1' })).expect(409);
    expect(r.body).toMatchObject({ code: 'SOLICITUD_ABIERTA_EXISTENTE', params: { id: primera, estado: 'PENDIENTE' } });
    expect(r.body.message).toBe(`La cédula ya tiene la solicitud #${primera} en estado pendiente. Debe resolverse antes de registrar otra`);
  });

  it('admite otra solicitud cuando la anterior se rechazó, pero no con otra fecha de nacimiento', async () => {
    const primera = await crear({ cedula: 'DUPLICADA-2' });
    await como(analista).post(`/api/v1/solicitudes/${primera}/rechazar`, { observaciones: 'No califica' }).expect(200);
    const r = await como(oficial)
      .post('/api/v1/solicitudes', cuerpoSolicitud({ cedula: 'DUPLICADA-2', fechaNacimiento: '1991-02-02' })).expect(409);
    expect(r.body.code).toBe('CEDULA_FECHA_DISTINTA');
    await como(oficial).post('/api/v1/solicitudes', cuerpoSolicitud({ cedula: 'DUPLICADA-2' })).expect(201);
  });

  it('rechaza menores de 18 años con 422', async () => {
    const r = await como(oficial).post('/api/v1/solicitudes', cuerpoSolicitud({ fechaNacimiento: fechaHaceAnios(16) })).expect(422);
    expect(r.body).toMatchObject({ code: 'EDAD_MINIMA_NO_ALCANZADA', params: { min: 18 } });
  });

  it('rechaza una antigüedad laboral imposible para la edad con 422', async () => {
    const r = await como(oficial)
      .post('/api/v1/solicitudes', cuerpoSolicitud({ fechaNacimiento: fechaHaceAnios(25), antiguedadAnios: 20 })).expect(422);
    expect(r.body).toMatchObject({ code: 'ANTIGUEDAD_INCONSISTENTE' });
  });

  it('rechaza un plazo de más de 30 años con 422', async () => {
    const r = await como(oficial)
      .post('/api/v1/solicitudes', cuerpoSolicitud({ cantidadCuotas: 31, periodicidad: 'ANUAL' })).expect(422);
    expect(r.body).toMatchObject({ code: 'PLAZO_MAXIMO_EXCEDIDO', params: { max: 30 } });
    expect(r.body.message).toBe('El plazo del crédito no puede superar 30 años');
  });

  it('valida el formato del nombre y del teléfono', async () => {
    const r = await como(oficial)
      .post('/api/v1/solicitudes', cuerpoSolicitud({ nombreCompleto: 'Ana 123', telefono: 'no tengo' })).expect(400);
    expect(r.body.details).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'nombreCompleto', code: 'FORMATO_INVALIDO' }),
      expect.objectContaining({ field: 'telefono', code: 'FORMATO_INVALIDO' }),
    ]));
  });

  it('rechaza un tipo de empleo inexistente con 404', async () => {
    const r = await como(oficial).post('/api/v1/solicitudes', cuerpoSolicitud({ tipoEmpleoId: 99 })).expect(404);
    expect(r.body.message).toBe('No se encontró el tipo de empleo');
  });

  it('lista con filtros y obtiene por id', async () => {
    const id = await crear({ cedula: 'FILTRO-1' });
    const lista = await como(analista).get('/api/v1/solicitudes?cedula=FILTRO-1&estado=PENDIENTE').expect(200);
    expect(lista.body).toMatchObject({ total: 1, page: 1, pageSize: 20 });
    expect(lista.body.items[0]).toMatchObject({ id, cedula: 'FILTRO-1', montoSolicitado: '10000.00' });
    await como(analista).get(`/api/v1/solicitudes/${id}`).expect(200);
    await como(analista).get('/api/v1/solicitudes/999999').expect(404);
    await como(analista).get('/api/v1/solicitudes/abc').expect(400);
  });

  it('ordena por fecha de registro: más nuevas primero por defecto, más viejas con orden=asc', async () => {
    const ids = [await crear(), await crear(), await crear()];
    // Solo interesa el orden relativo de las tres; el archivo crea otras solicitudes pendientes.
    const orden = async (query: string) =>
      (await como(analista).get(`/api/v1/solicitudes?estado=PENDIENTE&pageSize=100${query}`).expect(200)).body.items
        .map((s: { id: number }) => s.id).filter((id: number) => ids.includes(id));
    expect(await orden('')).toEqual([ids[2], ids[1], ids[0]]);
    expect(await orden('&orden=desc')).toEqual([ids[2], ids[1], ids[0]]);
    expect(await orden('&orden=asc')).toEqual(ids);
    await como(analista).get('/api/v1/solicitudes?orden=lateral').expect(400);
  });

  it('aprobar crea el crédito y devuelve ambos', async () => {
    const id = await crear();
    const r = await como(analista).post(`/api/v1/solicitudes/${id}/aprobar`, { observaciones: 'Buen perfil' }).expect(200);
    expect(r.body.solicitud).toMatchObject({
      estado: 'APROBADA', observaciones: 'Buen perfil', dictaminadaPor: { username: 'analista' },
    });
    expect(r.body.credito).toMatchObject({ numero: expect.stringMatching(/^CR-\d{6}$/), cuotaNivelada: '888.49' });
    expect(r.body.solicitud.creditoId).toBe(r.body.credito.id);
  });

  it('no aprueba dos veces', async () => {
    const id = await crear();
    await como(analista).post(`/api/v1/solicitudes/${id}/aprobar`, { observaciones: 'ok' }).expect(200);
    const r = await como(analista).post(`/api/v1/solicitudes/${id}/aprobar`, { observaciones: 'ok' }).expect(409);
    expect(r.body.message).toBe('No es posible aprobar una solicitud en estado aprobada');
  });

  it('observaciones vacías o de solo espacios dan 400 REQUERIDO (se recortan antes de validar)', async () => {
    const id = await crear();
    const vacias = await como(analista).post(`/api/v1/solicitudes/${id}/rechazar`, {}).expect(400);
    expect(vacias.body.details[0]).toMatchObject({ field: 'observaciones', code: 'REQUERIDO' });
    const espacios = await como(analista).post(`/api/v1/solicitudes/${id}/rechazar`, { observaciones: '   ' }).expect(400);
    expect(espacios.body.details[0]).toMatchObject({ field: 'observaciones', code: 'REQUERIDO' });
  });

  it('rechazar no crea crédito', async () => {
    const id = await crear();
    const r = await como(analista).post(`/api/v1/solicitudes/${id}/rechazar`, { observaciones: 'Ingresos bajos' }).expect(200);
    expect(r.body).toMatchObject({ solicitud: { estado: 'RECHAZADA', creditoId: null }, credito: null });
  });
});
