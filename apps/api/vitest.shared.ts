import path from 'node:path';
import swc from 'unplugin-swc';
import type { UserConfig } from 'vitest/config';

export const configuracionBase: UserConfig = {
  plugins: [swc.vite({ module: { type: 'es6' } })],
  resolve: {
    alias: {
      '@credito/domain': path.resolve(__dirname, '../../packages/domain/src/index.ts'),
    },
  },
};
