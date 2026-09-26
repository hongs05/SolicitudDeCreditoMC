import { ValidationPipe } from '@nestjs/common';
import { aplanarErrores } from './aplanar-errores';
import { ValidacionException } from './validacion.exception';

export const crearValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errores) => new ValidacionException(aplanarErrores(errores)),
  });
