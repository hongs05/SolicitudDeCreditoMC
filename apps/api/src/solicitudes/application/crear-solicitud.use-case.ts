import { type DatosSolicitud, NoEncontradoError, Solicitud, verificarHistorialCedula } from '@credito/domain';
import type { Clock } from '../../shared/application/ports/clock';
import type { UnitOfWork } from '../../shared/application/ports/unit-of-work';

export class CrearSolicitud {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  ejecutar(datos: DatosSolicitud, usuarioId: number): Promise<number> {
    return this.uow.run(async (repos) => {
      const solicitud = Solicitud.crear(datos, usuarioId, this.clock.hoy(), this.clock.ahora());
      if (!(await repos.catalogos.existeTipoEmpleo(datos.tipoEmpleoId))) {
        throw new NoEncontradoError('TipoEmpleo');
      }
      // Dentro de la transacción: dos altas simultáneas de la misma cédula no pueden pasar las dos.
      verificarHistorialCedula(datos.fechaNacimiento, await repos.solicitudes.historialPorCedula(datos.cedula));
      const creada = await repos.solicitudes.crear(solicitud);
      return creada.id!;
    });
  }
}
