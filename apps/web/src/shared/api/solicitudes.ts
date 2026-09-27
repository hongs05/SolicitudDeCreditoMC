import type { EstadoSolicitud } from '@credito/domain';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './cliente';
import { aQuery } from './query-string';
import type { Paginado, SolicitudResponse, SolicitudResumen } from './tipos';

export interface FiltrosSolicitudes {
  estado?: EstadoSolicitud;
  cedula?: string;
  page: number;
  pageSize?: number;
}

export const useSolicitudes = (f: FiltrosSolicitudes, habilitado = true) =>
  useQuery({
    queryKey: ['solicitudes', f],
    queryFn: () => api.get<Paginado<SolicitudResumen>>(`/solicitudes?${aQuery({ ...f })}`),
    placeholderData: keepPreviousData,
    enabled: habilitado,
  });

/** Total de solicitudes en un estado (o de todas), para las tarjetas y el menú. Pide una sola fila. */
export const useConteoSolicitudes = (estado?: EstadoSolicitud, habilitado = true) =>
  useQuery({
    queryKey: ['solicitudes', 'conteo', estado ?? 'TODAS'],
    queryFn: () => api.get<Paginado<SolicitudResumen>>(`/solicitudes?${aQuery({ estado, page: 1, pageSize: 1 })}`),
    select: (r) => r.total,
    enabled: habilitado,
  });

export const useSolicitud = (id: number) =>
  useQuery({ queryKey: ['solicitud', id], queryFn: () => api.get<SolicitudResponse>(`/solicitudes/${id}`) });

export function useCrearSolicitud() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (cuerpo: Record<string, unknown>) => api.post<SolicitudResponse>('/solicitudes', cuerpo),
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['solicitudes'] }),
  });
}
