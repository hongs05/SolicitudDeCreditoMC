import { Rol } from '@credito/domain';
import type { PrismaClient } from '@prisma/client';
import type { PasswordHasher } from '../../../auth/application/ports/password-hasher';

export const CONTRASENA_DEMO = 'Demo2026!';

export const TIPOS_EMPLEO = [
  { codigo: 'ASALARIADO', nombre: 'Asalariado' },
  { codigo: 'INDEPENDIENTE', nombre: 'Independiente' },
];

export const BANCOS = [
  { codigo: 'LAFISE', nombre: 'LAFISE' },
  { codigo: 'FICOHSA', nombre: 'FICOHSA' },
  { codigo: 'BAC_CREDOMATIC', nombre: 'BAC Credomatic' },
  { codigo: 'BANPRO', nombre: 'Banpro' },
];

export const USUARIOS_DEMO = [
  { username: 'oficial', rol: Rol.OFICIAL },
  { username: 'analista', rol: Rol.ANALISTA },
  { username: 'cajero', rol: Rol.CAJERO },
  { username: 'admin', rol: Rol.ADMIN },
];

export async function sembrar(prisma: PrismaClient, hasher: PasswordHasher): Promise<void> {
  for (const tipo of TIPOS_EMPLEO) {
    await prisma.tipoEmpleo.upsert({ where: { codigo: tipo.codigo }, update: { nombre: tipo.nombre }, create: tipo });
  }
  for (const banco of BANCOS) {
    await prisma.banco.upsert({ where: { codigo: banco.codigo }, update: { nombre: banco.nombre }, create: banco });
  }
  for (const usuario of USUARIOS_DEMO) {
    const existente = await prisma.usuario.findUnique({ where: { username: usuario.username } });
    if (!existente) {
      await prisma.usuario.create({
        data: { ...usuario, passwordHash: await hasher.hash(CONTRASENA_DEMO) },
      });
    }
  }
}
