import { EstadoSolicitud, Rol, tieneRol } from '@credito/domain';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { type FiltrosSolicitudes, useSolicitudes } from '../../shared/api/solicitudes';
import type { SolicitudResumen } from '../../shared/api/tipos';
import { formatearDinero, formatearInstante } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { BadgeEstado } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { Field, Input, Select } from '../../shared/ui/Campos';
import { Card } from '../../shared/ui/Card';
import { Cargando } from '../../shared/ui/Cargando';
import { ErrorConsulta } from '../../shared/ui/ErrorConsulta';
import { Paginador } from '../../shared/ui/Paginador';
import { type Columna, Tabla } from '../../shared/ui/Tabla';
import { useAuth } from '../auth/AuthProvider';

export function ListadoPage() {
  const { t, locale } = useT();
  const { usuario } = useAuth();
  const [filtros, setFiltros] = useState<FiltrosSolicitudes>({ page: 1 });
  const [estado, setEstado] = useState('');
  const [cedula, setCedula] = useState('');
  const consulta = useSolicitudes(filtros);

  const buscar = (evento: FormEvent) => {
    evento.preventDefault();
    setFiltros({ estado: (estado || undefined) as EstadoSolicitud | undefined, cedula: cedula.trim() || undefined, page: 1 });
  };

  const columnas: Columna<SolicitudResumen>[] = [
    { clave: 'id', titulo: '#', celda: (s) => s.id },
    { clave: 'cedula', titulo: t('campo.cedula'), celda: (s) => s.cedula },
    { clave: 'nombre', titulo: t('campo.nombreCompleto'), celda: (s) => s.nombreCompleto },
    { clave: 'monto', titulo: t('campo.montoSolicitado'), celda: (s) => formatearDinero(s.montoSolicitado, locale), derecha: true },
    { clave: 'cuotas', titulo: t('campo.cantidadCuotas'), celda: (s) => s.cantidadCuotas, derecha: true },
    { clave: 'periodicidad', titulo: t('campo.periodicidad'), celda: (s) => t(`periodicidad.${s.periodicidad}`) },
    { clave: 'estado', titulo: t('campo.estado'), celda: (s) => <BadgeEstado estado={s.estado} /> },
    { clave: 'fecha', titulo: t('campo.fecha'), celda: (s) => formatearInstante(s.creadaEn, locale) },
  ];

  return (
    <Card titulo={t('nav.solicitudes')}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <form onSubmit={buscar} className="flex flex-wrap items-end gap-3">
          <Field id="filtro-estado" etiqueta={t('campo.estado')}>
            <Select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">{t('comun.todos')}</option>
              {Object.values(EstadoSolicitud).map((e) => <option key={e} value={e}>{t(`estado.${e}`)}</option>)}
            </Select>
          </Field>
          <Field id="filtro-cedula" etiqueta={t('campo.cedula')}>
            <Input value={cedula} onChange={(e) => setCedula(e.target.value)} />
          </Field>
          <Button type="submit" variante="secundario">{t('comun.buscar')}</Button>
        </form>
        {usuario && tieneRol(usuario.rol, [Rol.OFICIAL]) && (
          <Link to="/solicitudes/nueva" className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
            {t('nav.nuevaSolicitud')}
          </Link>
        )}
      </div>
      {consulta.isPending ? <Cargando /> : consulta.isError ? (
        <ErrorConsulta error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : (
        <>
          <Tabla columnas={columnas} filas={consulta.data?.items ?? []} claveFila={(s) => s.id} />
          {consulta.data && consulta.data.total > 0 && (
            <Paginador page={filtros.page} pageSize={consulta.data.pageSize} total={consulta.data.total}
              onCambiar={(page) => setFiltros({ ...filtros, page })} />
          )}
        </>
      )}
    </Card>
  );
}
