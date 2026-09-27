import { IsInt, IsNotEmpty, Matches } from 'class-validator';
import { Minimo } from '../../shared/infrastructure/validation/decoradores';

export class DesembolsarDto {
  @IsInt() @Minimo(1)
  creditoId!: number;

  @IsInt() @Minimo(1)
  bancoId!: number;

  @IsNotEmpty() @Matches(/^\d{6,30}$/)
  numeroCuenta!: string;
}
