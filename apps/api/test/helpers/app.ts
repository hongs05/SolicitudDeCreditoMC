import type { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { BcryptPasswordHasher } from '../../src/auth/infrastructure/bcrypt-password-hasher';
import type { Configuracion } from '../../src/shared/infrastructure/config/configuracion';
import { configurarApp } from '../../src/shared/infrastructure/http/configurar-app';
import { sembrar } from '../../src/shared/infrastructure/prisma/semilla';
import { type BaseDatosPrueba, crearBaseDatosPrueba } from './base-datos';

export const configuracionPrueba = (url: string): Configuracion => ({
  databaseUrl: url,
  jwtSecret: 's'.repeat(32),
  jwtAccessTtlSegundos: 900,
  refreshTtlDias: 7,
  cookieSecure: false,
  zonaHoraria: 'America/Managua',
  puerto: 0,
});

export interface AppPrueba {
  app: INestApplication;
  db: BaseDatosPrueba;
  agente(): ReturnType<typeof request>;
  cerrar(): Promise<void>;
}

export async function crearAppPrueba(extras: Type[] = []): Promise<AppPrueba> {
  const db = await crearBaseDatosPrueba();
  await sembrar(db.prisma, new BcryptPasswordHasher(4));
  const modulo = await Test.createTestingModule({
    imports: [AppModule.forRoot(configuracionPrueba(db.url)), ...extras],
  }).compile();
  const app = modulo.createNestApplication();
  configurarApp(app);
  await app.init();
  return {
    app,
    db,
    agente: () => request(app.getHttpServer()),
    cerrar: async () => {
      await app.close();
      await db.cerrar();
    },
  };
}
