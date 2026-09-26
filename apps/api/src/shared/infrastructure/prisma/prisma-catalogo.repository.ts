import type { CatalogoRepository } from '../../application/ports/catalogo.repository';
import type { ItemCatalogo } from '../../application/vistas';
import type { ClientePrisma } from './decimal';

const SELECCION = { id: true, codigo: true, nombre: true } as const;

export class PrismaCatalogoRepository implements CatalogoRepository {
  constructor(private readonly db: ClientePrisma) {}

  async existeTipoEmpleo(id: number): Promise<boolean> {
    return (await this.db.tipoEmpleo.count({ where: { id } })) > 0;
  }

  async bancoActivo(id: number): Promise<boolean> {
    return (await this.db.banco.count({ where: { id, activo: true } })) > 0;
  }

  listarTiposEmpleo(): Promise<ItemCatalogo[]> {
    return this.db.tipoEmpleo.findMany({ select: SELECCION, orderBy: { id: 'asc' } });
  }

  listarBancos(): Promise<ItemCatalogo[]> {
    return this.db.banco.findMany({ where: { activo: true }, select: SELECCION, orderBy: { id: 'asc' } });
  }
}
