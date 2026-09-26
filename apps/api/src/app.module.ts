import { type DynamicModule, Module } from '@nestjs/common';
import { AuthModule } from './auth/infrastructure/auth.module';
import { HealthModule } from './health/health.module';
import type { Configuracion } from './shared/infrastructure/config/configuracion';
import { SharedModule } from './shared/infrastructure/shared.module';

@Module({})
export class AppModule {
  static forRoot(config: Configuracion): DynamicModule {
    return {
      module: AppModule,
      imports: [SharedModule.forRoot(config), AuthModule, HealthModule],
    };
  }
}
