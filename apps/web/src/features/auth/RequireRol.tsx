import { type Rol, tieneRol } from '@credito/domain';
import { Outlet } from 'react-router-dom';
import { Prohibido } from '../../shared/ui/Prohibido';
import { useAuth } from './AuthProvider';

export function RequireRol({ roles }: { roles: Rol[] }) {
  const { usuario } = useAuth();
  if (!usuario || !tieneRol(usuario.rol, roles)) return <Prohibido />;
  return <Outlet />;
}
