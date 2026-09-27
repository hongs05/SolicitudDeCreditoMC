import { useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { api } from '../../shared/api/cliente';
import { sesion, type TokensResponse, type UsuarioSesion } from '../../shared/api/sesion';

interface ContextoAuth {
  usuario: UsuarioSesion | null;
  iniciando: boolean;
  iniciarSesion(username: string, password: string): Promise<UsuarioSesion>;
  cerrarSesion(): Promise<void>;
}

const Contexto = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const estado = useSyncExternalStore(sesion.suscribir, sesion.obtener);
  const [iniciando, setIniciando] = useState(() => sesion.obtener().usuario === null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!iniciando) return;
    let activo = true;
    void api.refrescar().finally(() => {
      if (activo) setIniciando(false);
    });
    return () => {
      activo = false;
    };
  }, [iniciando]);

  const iniciarSesion = useCallback(async (username: string, password: string) => {
    const tokens = await api.post<TokensResponse>('/auth/login', { username, password });
    sesion.establecer(tokens);
    return tokens.usuario;
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      sesion.limpiar();
      queryClient.clear();
    }
  }, [queryClient]);

  const valor = useMemo<ContextoAuth>(
    () => ({ usuario: estado.usuario, iniciando, iniciarSesion, cerrarSesion }),
    [estado.usuario, iniciando, iniciarSesion, cerrarSesion],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return contexto;
}
