import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NOMBRE_COOKIE_REFRESH } from './auth/infrastructure/cookie';

export function configurarSwagger(app: INestApplication): void {
  const configuracion = new DocumentBuilder()
    .setTitle('API de solicitudes de crédito')
    .setDescription('Ciclo de vida de una solicitud: captura, comité, desembolso y plan de pagos.')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth(NOMBRE_COOKIE_REFRESH)
    .build();
  const documento = SwaggerModule.createDocument(app, configuracion);
  SwaggerModule.setup('api/docs', app, documento);
}
