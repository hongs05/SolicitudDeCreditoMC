import { type INestApplication, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ErrorHandlerFilter } from '../errors/error-handler.filter';
import { crearValidationPipe } from '../validation/validation-pipe';

export function configurarApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use(cookieParser());
  app.useGlobalPipes(crearValidationPipe());
  app.useGlobalFilters(new ErrorHandlerFilter());
}
