import { resolverMensaje } from '@credito/domain';
import { ApiError } from './ApiError';
import { preferencias } from './preferencias';
import { sesion, type TokensResponse } from './sesion';

export interface HttpClient {
  get<T>(ruta: string): Promise<T>;
  post<T>(ruta: string, cuerpo?: unknown): Promise<T>;
  refrescar(): Promise<TokensResponse | null>;
}

const url = (base: string, ruta: string) => new URL(`${base}${ruta}`, window.location.origin).toString();

async function leerError(respuesta: Response): Promise<ApiError> {
  try {
    const cuerpo = (await respuesta.json()) as Partial<ApiError> & { details?: ApiError['details'] };
    return new ApiError(
      respuesta.status,
      cuerpo.code ?? 'ERROR_INTERNO',
      cuerpo.message ?? respuesta.statusText,
      cuerpo.details ?? [],
      cuerpo.params ?? {},
    );
  } catch {
    return new ApiError(respuesta.status, 'ERROR_INTERNO', resolverMensaje('ERROR_INTERNO', {}, preferencias.locale()));
  }
}

export function crearHttpClient(base = '/api/v1'): HttpClient {
  let refrescoEnCurso: Promise<TokensResponse | null> | null = null;

  function refrescar(): Promise<TokensResponse | null> {
    refrescoEnCurso ??= fetch(url(base, '/auth/refresh'), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Accept-Language': preferencias.locale() },
    })
      .then(async (respuesta) => {
        if (!respuesta.ok) return null;
        const tokens = (await respuesta.json()) as TokensResponse;
        sesion.establecer(tokens);
        return tokens;
      })
      .catch(() => null)
      .finally(() => {
        refrescoEnCurso = null;
      });
    return refrescoEnCurso;
  }

  async function solicitar<T>(metodo: 'GET' | 'POST', ruta: string, cuerpo?: unknown, reintento = false): Promise<T> {
    const cabeceras: Record<string, string> = { 'Accept-Language': preferencias.locale() };
    const token = sesion.obtener().accessToken;
    if (token) cabeceras.Authorization = `Bearer ${token}`;
    if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';

    let respuesta: Response;
    try {
      respuesta = await fetch(url(base, ruta), {
        method: metodo,
        headers: cabeceras,
        credentials: 'same-origin',
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      });
    } catch {
      throw new ApiError(0, 'ERROR_INTERNO', resolverMensaje('ERROR_INTERNO', {}, preferencias.locale()));
    }

    if (respuesta.ok) {
      return (respuesta.status === 204 ? undefined : await respuesta.json()) as T;
    }

    const error = await leerError(respuesta);
    const esAuth = ruta.startsWith('/auth/');
    if (error.status === 401 && error.code === 'NO_AUTENTICADO' && !reintento && !esAuth) {
      if (await refrescar()) return solicitar<T>(metodo, ruta, cuerpo, true);
    }
    if (error.status === 401 && ruta !== '/auth/login') sesion.limpiar();
    throw error;
  }

  return {
    get: <T>(ruta: string) => solicitar<T>('GET', ruta),
    post: <T>(ruta: string, cuerpo: unknown = {}) => solicitar<T>('POST', ruta, cuerpo),
    refrescar,
  };
}

export const api = crearHttpClient();
