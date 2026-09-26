import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const RAIZ_API = path.resolve(__dirname, '../..');

export interface BaseDatosPrueba {
  url: string;
  prisma: PrismaClient;
  cerrar(): Promise<void>;
}

export async function crearBaseDatosPrueba(): Promise<BaseDatosPrueba> {
  const carpeta = mkdtempSync(path.join(tmpdir(), 'credito-'));
  const url = `file:${path.join(carpeta, 'prueba.db')}`;
  execSync('npx prisma migrate deploy', {
    cwd: RAIZ_API,
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
  const prisma = new PrismaClient({ datasourceUrl: url });
  await prisma.$connect();
  return {
    url,
    prisma,
    cerrar: async () => {
      await prisma.$disconnect();
      rmSync(carpeta, { recursive: true, force: true });
    },
  };
}
