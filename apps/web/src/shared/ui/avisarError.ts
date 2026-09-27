import { ApiError } from '../api/ApiError';
import type { useToast } from './Toast';

type Toast = ReturnType<typeof useToast>;

/**
 * Muestra el error de una acción. Los errores de red y del servidor (0 o 5xx) ofrecen
 * Reintentar, porque repetir la acción puede funcionar; los de negocio solo informan.
 */
export function avisarError(toast: Toast, error: unknown, textos: { generico: string; reintentar: string }, reintentar?: () => void): void {
  const mensaje = error instanceof ApiError ? error.message : textos.generico;
  const reintentable = !(error instanceof ApiError) || error.status === 0 || error.status >= 500;
  toast.error(mensaje, reintentable && reintentar ? { accion: { etiqueta: textos.reintentar, ejecutar: reintentar } } : undefined);
}
