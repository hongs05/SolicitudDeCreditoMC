import type { ClientePrisma } from '../../shared/infrastructure/prisma/decimal';
import type { DesembolsoRepository, NuevoDesembolso } from '../application/ports/desembolso.repository';

export class PrismaDesembolsoRepository implements DesembolsoRepository {
  constructor(private readonly db: ClientePrisma) {}

  async crear(datos: NuevoDesembolso): Promise<{ id: number }> {
    const fila = await this.db.desembolso.create({ data: datos });
    return { id: fila.id };
  }
}
