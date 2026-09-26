import { EstadoSolicitud } from '@credito/domain';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginacionDto } from '../../shared/infrastructure/http/paginacion.dto';

export class FiltrosCreditosDto extends PaginacionDto {
  @IsOptional()
  @IsEnum(EstadoSolicitud)
  estado?: EstadoSolicitud;

  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsString()
  numero?: string;
}
