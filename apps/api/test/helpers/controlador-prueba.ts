import { Body, Controller, Get, HttpCode, Module, Post } from '@nestjs/common';
import { NoEncontradoError } from '@credito/domain';
import { IsNotEmpty, IsString } from 'class-validator';
import { Public } from '../../src/shared/infrastructure/http/publico.decorator';
import { DecimalMinimo, EsDecimal, Longitud } from '../../src/shared/infrastructure/validation/decoradores';

class PruebaDto {
  @IsNotEmpty()
  @IsString()
  @Longitud(3, 10)
  nombre!: string;

  @IsNotEmpty()
  @EsDecimal()
  @DecimalMinimo(0.01)
  monto!: string;
}

@Public()
@Controller('prueba')
class ControladorPrueba {
  @Get('dominio')
  dominio(): never {
    throw new NoEncontradoError('Credito');
  }

  @Get('fallo')
  fallo(): never {
    throw new Error('boom secreto');
  }

  @Post('validacion')
  @HttpCode(200)
  validacion(@Body() dto: PruebaDto): PruebaDto {
    return dto;
  }
}

@Module({ controllers: [ControladorPrueba] })
export class ModuloPrueba {}
