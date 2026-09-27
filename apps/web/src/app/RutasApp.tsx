import { Rol } from '@credito/domain';
import { Navigate, Route, Routes } from 'react-router-dom';
import { BandejaPage as BandejaComitePage } from '../features/comite/BandejaPage';
import { DictamenPage } from '../features/comite/DictamenPage';
import { BandejaPage as BandejaDesembolsosPage } from '../features/desembolsos/BandejaPage';
import { DesembolsoPage } from '../features/desembolsos/DesembolsoPage';
import { RequireRol } from '../features/auth/RequireRol';
import { LoginPage } from '../features/auth/LoginPage';
import { RequireAuth } from '../features/auth/RequireAuth';
import { ListadoPage } from '../features/solicitudes/ListadoPage';
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
          <Route path="/solicitudes" element={<ListadoPage />} />
          <Route element={<RequireRol roles={[Rol.OFICIAL]} />}>
            <Route path="/solicitudes/nueva" element={<NuevaSolicitudPage />} />
          </Route>
          <Route element={<RequireRol roles={[Rol.ANALISTA]} />}>
            <Route path="/comite" element={<BandejaComitePage />} />
            <Route path="/comite/:solicitudId" element={<DictamenPage />} />
          </Route>
          <Route element={<RequireRol roles={[Rol.CAJERO]} />}>
            <Route path="/desembolsos" element={<BandejaDesembolsosPage />} />
            <Route path="/desembolsos/:creditoId" element={<DesembolsoPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
