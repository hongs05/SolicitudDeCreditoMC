import { type DatosSolicitud, EstadoSolicitud, Periodicidad } from '@credito/domain';
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { PaginacionDto } from '../../shared/infrastructure/http/paginacion.dto';
import {
  DecimalMaximo, DecimalMinimo, EsDecimal, EsFechaPasada, Longitud, Maximo, Minimo,
} from '../../shared/infrastructure/validation/decoradores';

export class CrearSolicitudDto {
  @IsNotEmpty() @IsString() @Longitud(3, 120)
  nombreCompleto!: string;

  @IsNotEmpty() @IsString() @Longitud(5, 30) @Matches(/^\S+$/)
  cedula!: string;

  @IsNotEmpty() @IsEmail()
  correo!: string;

  @IsNotEmpty() @IsString() @Longitud(7, 20)
  telefono!: string;

  @IsNotEmpty() @EsFechaPasada()
  fechaNacimiento!: string;

  @IsInt() @Minimo(1)
  tipoEmpleoId!: number;

  @IsNotEmpty() @IsString() @Longitud(2, 120)
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
  @IsNotEmpty() @IsString() @Longitud(1, 1000)
  observaciones!: string;
}

export class FiltrosSolicitudesDto extends PaginacionDto {
  @IsOptional() @IsEnum(EstadoSolicitud)
  estado?: EstadoSolicitud;

  @IsOptional() @IsString()
  cedula?: string;
}

export const aDatosSolicitud = (dto: CrearSolicitudDto): DatosSolicitud => ({
  nombreCompleto: dto.nombreCompleto.trim(),
  cedula: dto.cedula,
  correo: dto.correo,
  telefono: dto.telefono,
  fechaNacimiento: dto.fechaNacimiento,
  tipoEmpleoId: dto.tipoEmpleoId,
  empresa: dto.empresa.trim(),
  antiguedadAnios: dto.antiguedadAnios,
  ingresoMensual: Number(dto.ingresoMensual),
  montoSolicitado: Number(dto.montoSolicitado),
  cantidadCuotas: dto.cantidadCuotas,
  tasaAnual: Number(dto.tasaAnual),
  periodicidad: dto.periodicidad,
});
