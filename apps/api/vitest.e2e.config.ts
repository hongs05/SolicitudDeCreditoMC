import { defineConfig, mergeConfig } from 'vitest/config';
import { configuracionBase } from './vitest.shared';

export default mergeConfig(
  configuracionBase,
  defineConfig({
    test: {
      include: ['test/**/*.e2e.spec.ts'],
      setupFiles: ['reflect-metadata'],
      testTimeout: 30_000,
      hookTimeout: 120_000,
    },
  }),
);
