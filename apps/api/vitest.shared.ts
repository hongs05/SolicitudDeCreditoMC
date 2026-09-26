import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import type { UserConfig } from 'vitest/config';

export const configuracionBase: UserConfig = {
  plugins: [swc.vite({ module: { type: 'es6' } })],
  resolve: {
    alias: {
      '@credito/domain': fileURLToPath(new URL('../../packages/domain/src/index.ts', import.meta.url)),
    },
  },
};
