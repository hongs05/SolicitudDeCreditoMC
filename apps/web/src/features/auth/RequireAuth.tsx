import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Cargando } from '../../shared/ui/Cargando';
import { useAuth } from './AuthProvider';

export function RequireAuth() {
  const { usuario, iniciando } = useAuth();
  const ubicacion = useLocation();
  if (iniciando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  return <Outlet />;
}
