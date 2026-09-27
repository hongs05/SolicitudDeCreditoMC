import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/api/cliente';
import type { DictamenResponse } from '../../shared/api/tipos';

export type AccionDictamen = 'aprobar' | 'rechazar';

export function useDictaminar(solicitudId: number) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ accion, observaciones }: { accion: AccionDictamen; observaciones: string }) =>
      api.post<DictamenResponse>(`/solicitudes/${solicitudId}/${accion}`, { observaciones }),
    onSettled: () => Promise.all([
      cliente.invalidateQueries({ queryKey: ['solicitudes'] }),
      cliente.invalidateQueries({ queryKey: ['solicitud', solicitudId] }),
      cliente.invalidateQueries({ queryKey: ['creditos'] }),
    ]),
  });
}
