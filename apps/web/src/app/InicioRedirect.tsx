import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { RUTA_INICIO } from './navegacion';

export function InicioRedirect() {
  const { usuario } = useAuth();
  return <Navigate to={usuario ? RUTA_INICIO[usuario.rol] : '/login'} replace />;
}
