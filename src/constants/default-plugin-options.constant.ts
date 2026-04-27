/**
 * Default Plugin Options
 *
 * Provides production-ready default values for the Vite config plugin.
 * Used as the base when the consumer does not provide specific options.
 *
 * @module constants/default-plugin-options
 */

import type { ViteConfigPluginOptions } from '@/interfaces/vite-config-plugin-options.interface';

/**
 * Default Vite config plugin options.
 *
 * Every field is populated so downstream code can rely on
 * `Required<ViteConfigPluginOptions>` after validation.
 *
 * @example
 * ```typescript
 * const merged = { ...DEFAULT_PLUGIN_OPTIONS, ...userOptions };
 * ```
 */
export const DEFAULT_PLUGIN_OPTIONS: Required<ViteConfigPluginOptions> = {
  /** @default {} */
  env: {},

  /** @default false */
  scanConfigFiles: false,

  /** Searches both `src/` and `config/` directories. */
  configFilePattern: ['src/**/*.config.ts', 'config/**/*.config.ts'],

  /** Skips `node_modules`, `dist`, `build`, and `.git`. */
  excludeDirs: ['node_modules', 'dist', 'build', '.git'],

  /** Resolved from Vite's `config.root` at build time. */
  root: process.cwd(),

  /** @default true */
  includeAll: true,

  /** @default [] */
  include: [],

  /** @default '__APP_CONFIG__' */
  globalName: '__APP_CONFIG__',

  /** Enabled in non-production environments. */
  enableHMR: process.env.NODE_ENV !== 'production',

  /** @default false */
  debug: false,
};
