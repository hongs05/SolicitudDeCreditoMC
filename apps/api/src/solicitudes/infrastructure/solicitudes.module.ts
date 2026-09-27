import { type Provider, Module } from '@nestjs/common';
import { CreditosModule } from '../../creditos/infrastructure/creditos.module';
import { CLOCK, type Clock } from '../../shared/application/ports/clock';
import { UNIT_OF_WORK, type UnitOfWork } from '../../shared/application/ports/unit-of-work';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { AprobarSolicitud } from '../application/aprobar-solicitud.use-case';
import { ConsultarSolicitudes } from '../application/consultar-solicitudes.use-case';
import { CrearSolicitud } from '../application/crear-solicitud.use-case';
import { SOLICITUD_CONSULTAS, type SolicitudConsultas } from '../application/ports/solicitud.consultas';
import { RechazarSolicitud } from '../application/rechazar-solicitud.use-case';
import { PrismaSolicitudConsultas } from './prisma-solicitud.consultas';
import { SolicitudesController } from './solicitudes.controller';
import { TiposEmpleoController } from './tipos-empleo.controller';

const escritura = [
  { clase: CrearSolicitud, crear: (u: UnitOfWork, c: Clock) => new CrearSolicitud(u, c) },
  { clase: AprobarSolicitud, crear: (u: UnitOfWork, c: Clock) => new AprobarSolicitud(u, c) },
  { clase: RechazarSolicitud, crear: (u: UnitOfWork, c: Clock) => new RechazarSolicitud(u, c) },
];

@Module({
  imports: [CreditosModule],
  controllers: [SolicitudesController, TiposEmpleoController],
  providers: [
    ...escritura.map(
      ({ clase, crear }): Provider => ({ provide: clase, inject: [UNIT_OF_WORK, CLOCK], useFactory: crear }),
    ),
    { provide: SOLICITUD_CONSULTAS, inject: [PrismaService], useFactory: (p: PrismaService) => new PrismaSolicitudConsultas(p) },
    {
      provide: ConsultarSolicitudes,
      inject: [SOLICITUD_CONSULTAS, CLOCK],
      useFactory: (s: SolicitudConsultas, c: Clock) => new ConsultarSolicitudes(s, c),
    },
  ],
})
export class SolicitudesModule {}
