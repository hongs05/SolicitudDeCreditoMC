import { useQuery } from '@tanstack/react-query';
import { api } from './cliente';
import type { ItemCatalogo } from './tipos';

export const useTiposEmpleo = () =>
  useQuery({ queryKey: ['catalogos', 'tipos-empleo'], queryFn: () => api.get<ItemCatalogo[]>('/tipos-empleo'), staleTime: Infinity });

export const useBancos = () =>
  useQuery({ queryKey: ['catalogos', 'bancos'], queryFn: () => api.get<ItemCatalogo[]>('/bancos'), staleTime: Infinity });
