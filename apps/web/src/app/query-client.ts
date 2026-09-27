import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../shared/api/ApiError';

const esErrorDelCliente = (error: unknown) => error instanceof ApiError && error.status >= 400 && error.status < 500;

export function crearQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (intentos, error) => !esErrorDelCliente(error) && intentos < 2,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}
