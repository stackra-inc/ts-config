/**
 * Define Config Utility
 *
 * Helper function to define config module options with type safety.
 * Follows the `defineConfig()` pattern popularized by Vite, Vitest,
 * and similar tools.
 *
 * @module utils/define-config
 */

import type { ConfigModuleOptions } from '@/interfaces';

/**
 * Helper function to define config module options with type safety.
 *
 * Provides IDE autocomplete and type checking for configuration objects.
 * This pattern is consistent with modern tooling (Vite, Vitest, etc.).
 *
 * @param config - The config module options object
 * @returns The same configuration object with proper typing
 *
 * @example
 * ```typescript
 * // config.config.ts
 * import { defineConfig } from '@stackra/config';
 *
 * export default defineConfig({
 *   default: 'env',
 *   sources: {
 *     env: {
 *       driver: 'env',
 *       ignoreEnvFile: true,
 *       envPrefix: 'auto',
 *     },
 *   },
 * });
 * ```
 */
export function defineConfig(config: ConfigModuleOptions): ConfigModuleOptions {
  return config;
}
