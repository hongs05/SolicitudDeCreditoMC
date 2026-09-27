import { Rol } from '@credito/domain';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRol } from '../features/auth/RequireRol';
import { LoginPage } from '../features/auth/LoginPage';
import { RequireAuth } from '../features/auth/RequireAuth';
import { NuevaSolicitudPage } from '../features/solicitudes/NuevaSolicitudPage';
import { InicioRedirect } from './InicioRedirect';
import { Layout } from './Layout';

export function RutasApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<InicioRedirect />} />
          <Route element={<RequireRol roles={[Rol.OFICIAL]} />}>
            <Route path="/solicitudes/nueva" element={<NuevaSolicitudPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
