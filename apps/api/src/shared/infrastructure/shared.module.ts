import { type DynamicModule, Global, Module } from '@nestjs/common';
import { CLOCK } from '../application/ports/clock';
import { CONFIGURACION, type Configuracion } from './config/configuracion';
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
      ],
      exports: [CONFIGURACION, PrismaService, CLOCK],
    };
  }
}
