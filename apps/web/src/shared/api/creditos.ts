import type { EstadoSolicitud } from '@credito/domain';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './cliente';
import { aQuery } from './query-string';
import type { CreditoResponse, CreditoResumen, DesembolsoResponse, Paginado, PlanPagosResponse } from './tipos';

export interface FiltrosCreditos {
  estado?: EstadoSolicitud;
  cedula?: string;
  page: number;
  pageSize?: number;
}

export const useCreditos = (f: FiltrosCreditos, habilitado = true) =>
  useQuery({
    queryKey: ['creditos', f],
    queryFn: () => api.get<Paginado<CreditoResumen>>(`/creditos?${aQuery({ ...f })}`),
    placeholderData: keepPreviousData,
    enabled: habilitado,
  });

export const useCreditosPorCedula = (cedula: string) =>
  useQuery({
    queryKey: ['creditos', { cedula, page: 1 }],
    queryFn: () => api.get<Paginado<CreditoResumen>>(`/creditos?${aQuery({ cedula, page: 1 })}`),
    enabled: cedula !== '',
  });

export const useCredito = (id: number | null) =>
  useQuery({
    queryKey: ['credito', id],
    queryFn: () => api.get<CreditoResponse>(`/creditos/${id}`),
    enabled: id !== null,
  });

/** Total de créditos cuya solicitud está en un estado, para el contador del menú. */
export const useConteoCreditos = (estado: EstadoSolicitud, habilitado = true) =>
  useQuery({
    queryKey: ['creditos', 'conteo', estado],
    queryFn: () => api.get<Paginado<CreditoResumen>>(`/creditos?${aQuery({ estado, page: 1, pageSize: 1 })}`),
    select: (r) => r.total,
    enabled: habilitado,
  });

export const usePlanPagos = (id: number | null) =>
  useQuery({
    queryKey: ['plan', id],
    queryFn: () => api.get<PlanPagosResponse>(`/creditos/${id}/plan-pagos`),
    enabled: id !== null,
  });

export function useDesembolsar() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (cuerpo: { creditoId: number; bancoId: number; numeroCuenta: string }) =>
      api.post<DesembolsoResponse>('/desembolsos', cuerpo),
    onSettled: (_r, _e, cuerpo) => Promise.all([
      cliente.invalidateQueries({ queryKey: ['credito', cuerpo.creditoId] }),
      cliente.invalidateQueries({ queryKey: ['creditos'] }),
    ]),
  });
}
