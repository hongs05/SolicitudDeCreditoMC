import type { ItemCatalogo } from '../vistas';

export interface CatalogoRepository {
  existeTipoEmpleo(id: number): Promise<boolean>;
  bancoActivo(id: number): Promise<boolean>;
  listarTiposEmpleo(): Promise<ItemCatalogo[]>;
  listarBancos(): Promise<ItemCatalogo[]>;
}

export const CATALOGO_REPOSITORY = Symbol('CatalogoRepository');
