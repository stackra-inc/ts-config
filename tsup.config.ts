/**
 * @fileoverview tsup build configuration for @stackra/ts-config
 * @module @stackra/ts-config
 * @see https://tsup.egoist.dev/
 */

import { defineConfig } from 'tsup';
import { basePreset } from '@stackra/tsup-config';

export default defineConfig({
  ...basePreset,
  entry: ['src/index.ts', 'src/vite.ts'],
});
