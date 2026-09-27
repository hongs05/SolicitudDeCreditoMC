import { EstadoSolicitud } from '@credito/domain';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginacionDto } from '../../shared/infrastructure/http/paginacion.dto';

const vacioAIndefinido = ({ value }: { value: unknown }): unknown => (value === '' ? undefined : value);

export class FiltrosCreditosDto extends PaginacionDto {
  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsEnum(EstadoSolicitud)
  estado?: EstadoSolicitud;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  cedula?: string;

  @Transform(vacioAIndefinido)
  @IsOptional()
  @IsString()
  numero?: string;
}
