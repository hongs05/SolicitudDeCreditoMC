import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { ConsultarCreditos } from '../application/consultar-creditos.use-case';
import { CREDITO_CONSULTAS, type CreditoConsultas } from '../application/ports/credito.consultas';
import { CreditosController } from './creditos.controller';
import { PrismaCreditoConsultas } from './prisma-credito.consultas';

@Module({
  controllers: [CreditosController],
  providers: [
    { provide: CREDITO_CONSULTAS, inject: [PrismaService], useFactory: (p: PrismaService) => new PrismaCreditoConsultas(p) },
    { provide: ConsultarCreditos, inject: [CREDITO_CONSULTAS], useFactory: (c: CreditoConsultas) => new ConsultarCreditos(c) },
  ],
  exports: [ConsultarCreditos],
})
export class CreditosModule {}
