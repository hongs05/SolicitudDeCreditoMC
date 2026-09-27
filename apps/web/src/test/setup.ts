import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { sesion } from '../shared/api/sesion';
import { servidor } from './servidor';

beforeAll(() => servidor.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  servidor.resetHandlers();
  sesion.limpiar();
});
afterAll(() => servidor.close());
