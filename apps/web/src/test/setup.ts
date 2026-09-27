import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { preferencias } from '../shared/api/preferencias';
import { sesion } from '../shared/api/sesion';
import { servidor } from './servidor';

beforeAll(() => servidor.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  servidor.resetHandlers();
  sesion.limpiar();
  preferencias.fijarLocale('es');
});
afterAll(() => servidor.close());
