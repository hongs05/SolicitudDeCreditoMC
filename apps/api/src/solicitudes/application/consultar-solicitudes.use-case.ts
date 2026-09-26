import { calcularCuotaNivelada, calcularEdad, NoEncontradoError } from '@credito/domain';
import type { Clock } from '../../shared/application/ports/clock';
import type { Paginado } from '../../shared/application/vistas';
import type { FiltrosSolicitudes, SolicitudConsultas, SolicitudVista } from './ports/solicitud.consultas';

export interface SolicitudDetalle extends SolicitudVista {
  edad: number;
  cuotaNivelada: number;
}

export class ConsultarSolicitudes {
  constructor(
    private readonly consultas: SolicitudConsultas,
    private readonly clock: Clock,
  ) {}

  listar(filtros: FiltrosSolicitudes): Promise<Paginado<SolicitudVista>> {
    return this.consultas.listar(filtros);
  }

  async obtener(id: number): Promise<SolicitudDetalle> {
    const vista = await this.consultas.obtener(id);
    if (!vista) throw new NoEncontradoError('Solicitud');
    return {
      ...vista,
      edad: calcularEdad(vista.fechaNacimiento, this.clock.hoy()),
      cuotaNivelada: calcularCuotaNivelada({
        monto: vista.montoSolicitado,
        tasaAnual: vista.tasaAnual,
        cuotas: vista.cantidadCuotas,
        periodicidad: vista.periodicidad,
      }),
    };
  }
}
