import { type DynamicModule, Global, Module } from '@nestjs/common';
import { CLOCK } from '../application/ports/clock';
import { CATALOGO_REPOSITORY } from '../application/ports/catalogo.repository';
import { UNIT_OF_WORK } from '../application/ports/unit-of-work';
import { CONFIGURACION, type Configuracion } from './config/configuracion';
import { PrismaCatalogoRepository } from './prisma/prisma-catalogo.repository';
import { PrismaUnitOfWork } from './prisma/prisma-unit-of-work';
import { PrismaService } from './prisma/prisma.service';
import { SystemClock } from './system-clock';

@Global()
@Module({})
export class SharedModule {
  static forRoot(config: Configuracion): DynamicModule {
    return {
      module: SharedModule,
      providers: [
        { provide: CONFIGURACION, useValue: config },
        { provide: PrismaService, useFactory: () => new PrismaService(config) },
        { provide: CLOCK, useFactory: () => new SystemClock(config.zonaHoraria) },
        { provide: UNIT_OF_WORK, inject: [PrismaService], useFactory: (p: PrismaService) => new PrismaUnitOfWork(p) },
        { provide: CATALOGO_REPOSITORY, inject: [PrismaService], useFactory: (p: PrismaService) => new PrismaCatalogoRepository(p) },
      ],
      exports: [CONFIGURACION, PrismaService, CLOCK, UNIT_OF_WORK, CATALOGO_REPOSITORY],
    };
  }
}
