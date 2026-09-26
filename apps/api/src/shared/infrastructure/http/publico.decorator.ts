import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICO = 'esPublico';
export const Public = () => SetMetadata(ES_PUBLICO, true);
