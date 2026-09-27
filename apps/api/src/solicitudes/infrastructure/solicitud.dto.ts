import { type DatosSolicitud, EstadoSolicitud, Periodicidad } from '@credito/domain';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { PaginacionDto } from '../../shared/infrastructure/http/paginacion.dto';
import {
  DecimalMaximo, DecimalMinimo, EsDecimal, EsFechaPasada, Longitud, Maximo, Minimo,
} from '../../shared/infrastructure/validation/decoradores';

const recortar = ({ value }: { value: unknown }): unknown => (typeof value === 'string' ? value.trim() : value);

export class CrearSolicitudDto {
  @Transform(recortar) @IsNotEmpty() @IsString() @Longitud(3, 120)
  nombreCompleto!: string;

  @Transform(recortar) @IsNotEmpty() @IsString() @Longitud(5, 30) @Matches(/^\S+$/)
  cedula!: string;

  @Transform(recortar) @IsNotEmpty() @IsEmail()
  correo!: string;

  @Transform(recortar) @IsNotEmpty() @IsString() @Longitud(7, 20)
  telefono!: string;

  @IsNotEmpty() @EsFechaPasada()
  fechaNacimiento!: string;

  @IsInt() @Minimo(1)
  tipoEmpleoId!: number;

  @Transform(recortar) @IsNotEmpty() @IsString() @Longitud(2, 120)
  empresa!: string;

  @IsInt() @Minimo(0) @Maximo(60)
  antiguedadAnios!: number;

  @IsNotEmpty() @EsDecimal() @DecimalMinimo(0.01)
  ingresoMensual!: string;

  @IsNotEmpty() @EsDecimal() @DecimalMinimo(0.01)
  montoSolicitado!: string;

  @IsInt() @Minimo(1) @Maximo(360)
  cantidadCuotas!: number;

  @IsNotEmpty() @EsDecimal() @DecimalMaximo(100)
  tasaAnual!: string;

  @IsNotEmpty() @IsEnum(Periodicidad)
  periodicidad!: Periodicidad;
}

export class DictamenDto {
  @Transform(recortar) @IsNotEmpty() @IsString() @Longitud(1, 1000)
  observaciones!: string;
}

const vacioAIndefinido = ({ value }: { value: unknown }): unknown => (value === '' ? undefined : value);

export class FiltrosSolicitudesDto extends PaginacionDto {
  @Transform(vacioAIndefinido) @IsOptional() @IsEnum(EstadoSolicitud)
  estado?: EstadoSolicitud;

  @Transform(vacioAIndefinido) @IsOptional() @IsString()
  cedula?: string;

  /** Por fecha de registro. `asc` sirve a la bandeja del comité, que atiende por orden de llegada. */
  @Transform(vacioAIndefinido) @IsOptional() @IsIn(['asc', 'desc'])
  orden?: 'asc' | 'desc';
}

export const aDatosSolicitud = (dto: CrearSolicitudDto): DatosSolicitud => ({
  nombreCompleto: dto.nombreCompleto,
  cedula: dto.cedula,
  correo: dto.correo,
  telefono: dto.telefono,
  fechaNacimiento: dto.fechaNacimiento,
  tipoEmpleoId: dto.tipoEmpleoId,
  empresa: dto.empresa,
  antiguedadAnios: dto.antiguedadAnios,
  ingresoMensual: Number(dto.ingresoMensual),
  montoSolicitado: Number(dto.montoSolicitado),
  cantidadCuotas: dto.cantidadCuotas,
  tasaAnual: Number(dto.tasaAnual),
  periodicidad: dto.periodicidad,
});
