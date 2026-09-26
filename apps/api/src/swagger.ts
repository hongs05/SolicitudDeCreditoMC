import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NOMBRE_COOKIE_REFRESH } from './auth/infrastructure/cookie';

interface CapaExpress {
  route?: unknown;
}

interface EnrutadorExpress {
  stack: CapaExpress[];
}

/**
 * Si `app.init()` ya corrió (como en las pruebas e2e, que reutilizan una app
 * ya inicializada), Nest ya registró su manejador de "no encontrado" como un
 * middleware que responde a cualquier ruta. Express ejecuta las capas en el
 * orden en que se registraron, así que las rutas de Swagger añadidas después
 * de ese manejador nunca se alcanzarían. Esta función las reubica justo
 * antes de la primera capa que no es una ruta concreta (el manejador de
 * "no encontrado" y el de errores), para que funcionen sin importar si
 * `configurarSwagger` se llama antes o después de `app.init()`.
 */
function reubicarCapasDeSwagger(app: INestApplication, cantidadPrevia: number): void {
  const instancia = app.getHttpAdapter().getInstance() as { router?: EnrutadorExpress; _router?: EnrutadorExpress };
  const enrutador = instancia.router ?? instancia._router;
  if (!enrutador || cantidadPrevia === 0) return;

  const capasNuevas = enrutador.stack.splice(cantidadPrevia);
  if (capasNuevas.length === 0) return;

  const capasPrevias = enrutador.stack.slice(0, cantidadPrevia);
  const ultimaRuta = capasPrevias.reduce((indice, capa, i) => (capa.route ? i : indice), -1);
  enrutador.stack.splice(ultimaRuta + 1, 0, ...capasNuevas);
}

export function configurarSwagger(app: INestApplication): void {
  const configuracion = new DocumentBuilder()
    .setTitle('API de solicitudes de crédito')
    .setDescription('Ciclo de vida de una solicitud: captura, comité, desembolso y plan de pagos.')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth(NOMBRE_COOKIE_REFRESH)
    .build();
  const documento = SwaggerModule.createDocument(app, configuracion);

  const instancia = app.getHttpAdapter().getInstance() as { router?: EnrutadorExpress; _router?: EnrutadorExpress };
  const cantidadPrevia = (instancia.router ?? instancia._router)?.stack.length ?? 0;

  SwaggerModule.setup('api/docs', app, documento);

  reubicarCapasDeSwagger(app, cantidadPrevia);
}
