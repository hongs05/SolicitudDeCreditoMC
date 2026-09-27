import type { EstadoSolicitud } from '@credito/domain';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './cliente';
import { aQuery } from './query-string';
import type { Paginado, SolicitudResponse, SolicitudResumen } from './tipos';

export interface FiltrosSolicitudes {
  estado?: EstadoSolicitud;
  cedula?: string;
  page: number;
}

export const useSolicitudes = (f: FiltrosSolicitudes) =>
  useQuery({
    queryKey: ['solicitudes', f],
    queryFn: () => api.get<Paginado<SolicitudResumen>>(`/solicitudes?${aQuery({ ...f })}`),
    placeholderData: keepPreviousData,
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
