import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { cargarArchivoEnv } from './cargar-env';
import { cargarConfiguracion } from './shared/infrastructure/config/configuracion';
import { configurarApp } from './shared/infrastructure/http/configurar-app';
import { configurarSwagger } from './swagger';

async function iniciar(): Promise<void> {
  cargarArchivoEnv();
  const config = cargarConfiguracion(process.env);
  const app = await NestFactory.create(AppModule.forRoot(config));
  configurarApp(app);
  configurarSwagger(app);
  app.enableShutdownHooks();
  await app.listen(config.puerto);
}

iniciar().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
