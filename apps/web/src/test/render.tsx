import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthProvider';
import { sesion, type UsuarioSesion } from '../shared/api/sesion';
import { I18nProvider } from '../shared/i18n/I18nProvider';
import { ToastProvider } from '../shared/ui/Toast';

export function renderizar(ui: ReactElement, opciones: { ruta?: string; usuario?: UsuarioSesion } = {}) {
  if (opciones.usuario) sesion.establecer({ accessToken: 'token-prueba', usuario: opciones.usuario });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Envoltura = ({ children }: { children: ReactNode }) => (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <MemoryRouter
          initialEntries={[opciones.ruta ?? '/']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          {children}
        </MemoryRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
  return { user: userEvent.setup(), queryClient, ...render(ui, { wrapper: Envoltura }) };
}
