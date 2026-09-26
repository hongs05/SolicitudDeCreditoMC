import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { Configuracion } from '../config/configuracion';

export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: Configuracion) {
    super({ datasourceUrl: config.databaseUrl });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
