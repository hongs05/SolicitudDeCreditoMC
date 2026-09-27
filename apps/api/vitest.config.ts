import { defineConfig, mergeConfig } from 'vitest/config';
import { configuracionBase } from './vitest.shared';

export default mergeConfig(
  configuracionBase,
  defineConfig({ test: { include: ['src/**/*.spec.ts'], setupFiles: ['reflect-metadata'] } }),
);
