import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { Maximo, Minimo } from '../validation/decoradores';

export class PaginacionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Minimo(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Minimo(1)
  @Maximo(100)
  pageSize: number = 20;
}
