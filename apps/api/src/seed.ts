import { PrismaClient } from '@prisma/client';
import { BcryptPasswordHasher } from './auth/infrastructure/bcrypt-password-hasher';
import { cargarArchivoEnv } from './cargar-env';
import { sembrar } from './shared/infrastructure/prisma/semilla';

async function main(): Promise<void> {
  cargarArchivoEnv();
  const prisma = new PrismaClient();
  try {
    await sembrar(prisma, new BcryptPasswordHasher());
    console.log('Seed completado');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
