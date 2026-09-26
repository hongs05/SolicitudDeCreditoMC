import { Controller, Get, Inject } from '@nestjs/common';
import { CATALOGO_REPOSITORY, type CatalogoRepository } from '../../shared/application/ports/catalogo.repository';
import type { ItemCatalogo } from '../../shared/application/vistas';

@Controller('bancos')
export class BancosController {
  constructor(@Inject(CATALOGO_REPOSITORY) private readonly catalogos: CatalogoRepository) {}

  @Get()
  listar(): Promise<ItemCatalogo[]> {
    return this.catalogos.listarBancos();
  }
}
