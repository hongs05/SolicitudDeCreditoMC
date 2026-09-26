import { type DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIGURACION, type Configuracion } from './config/configuracion';
import { PrismaService } from './prisma/prisma.service';

@Global()
@Module({})
export class SharedModule {
  static forRoot(config: Configuracion): DynamicModule {
    return {
      module: SharedModule,
      providers: [
        { provide: CONFIGURACION, useValue: config },
        { provide: PrismaService, useFactory: () => new PrismaService(config) },
      ],
      exports: [CONFIGURACION, PrismaService],
    };
  }
}
