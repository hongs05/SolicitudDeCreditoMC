import { Module } from '@nestjs/common';
import { CreditosModule } from '../../creditos/infrastructure/creditos.module';
import { CLOCK, type Clock } from '../../shared/application/ports/clock';
import { UNIT_OF_WORK, type UnitOfWork } from '../../shared/application/ports/unit-of-work';
import { Desembolsar } from '../application/desembolsar.use-case';
import { BancosController } from './bancos.controller';
import { DesembolsosController } from './desembolsos.controller';

@Module({
  imports: [CreditosModule],
  controllers: [DesembolsosController, BancosController],
  providers: [
    { provide: Desembolsar, inject: [UNIT_OF_WORK, CLOCK], useFactory: (u: UnitOfWork, c: Clock) => new Desembolsar(u, c) },
  ],
})
export class DesembolsosModule {}
