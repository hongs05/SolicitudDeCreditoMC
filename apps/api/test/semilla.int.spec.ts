import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '../src/auth/infrastructure/bcrypt-password-hasher';
import { CONTRASENA_DEMO, sembrar } from '../src/shared/infrastructure/prisma/semilla';
import { type BaseDatosPrueba, crearBaseDatosPrueba } from './helpers/base-datos';

describe('semilla', () => {
  let db: BaseDatosPrueba;
  const hasher = new BcryptPasswordHasher(4);

  beforeAll(async () => {
    db = await crearBaseDatosPrueba();
  });
  afterAll(async () => {
    await db.cerrar();
  });

  it('es idempotente y crea catálogos y usuarios', async () => {
    await sembrar(db.prisma, hasher);
    await sembrar(db.prisma, hasher);

    expect(await db.prisma.tipoEmpleo.count()).toBe(2);
    expect(await db.prisma.banco.count()).toBe(4);
    const usuarios = await db.prisma.usuario.findMany({ orderBy: { username: 'asc' } });
    expect(usuarios.map((u) => [u.username, u.rol])).toEqual([
      ['admin', 'ADMIN'],
      ['analista', 'ANALISTA'],
      ['cajero', 'CAJERO'],
      ['oficial', 'OFICIAL'],
    ]);
    expect(await hasher.comparar(CONTRASENA_DEMO, usuarios[0]!.passwordHash)).toBe(true);
  });

  it('guarda el nombre comercial de los bancos', async () => {
    const bac = await db.prisma.banco.findUnique({ where: { codigo: 'BAC_CREDOMATIC' } });
    expect(bac).toMatchObject({ nombre: 'BAC Credomatic', activo: true });
  });
});
