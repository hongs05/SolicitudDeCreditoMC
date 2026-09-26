import type { PrismaClient } from '@prisma/client';
import type { RepositoriosTx, UnitOfWork } from '../../application/ports/unit-of-work';
import type { ClientePrisma } from './decimal';
import { crearRepositorios } from './repositorios';

export class PrismaUnitOfWork implements UnitOfWork {
  private cola: Promise<unknown> = Promise.resolve();

  constructor(private readonly prisma: PrismaClient) {}

  run<T>(fn: (repos: RepositoriosTx) => Promise<T>): Promise<T> {
    const ejecucion = this.cola.then(() =>
      this.prisma.$transaction((tx) => fn(this.crearRepositorios(tx)), { maxWait: 5_000, timeout: 15_000 }),
    );
    this.cola = ejecucion.catch(() => undefined);
    return ejecucion;
  }

  protected crearRepositorios(tx: ClientePrisma): RepositoriosTx {
    return crearRepositorios(tx);
  }
}
