/**
 * Plugin Configuration Validation Utility
 *
 * Validates and normalizes user-provided Vite plugin options, merging
 * them with sensible defaults. Ensures all fields are present and
 * internally consistent before the plugin starts scanning files.
 *
 * @module utils/validate-plugin-config
 */

import { DEFAULT_PLUGIN_OPTIONS } from '@/constants/default-plugin-options.constant';
import type { ViteConfigPluginOptions } from '@/interfaces/vite-config-plugin-options.interface';

/**
 * Validate and normalize Vite plugin options.
 *
 * Merges user options with {@link DEFAULT_PLUGIN_OPTIONS} and coerces
 * scalar values to arrays where needed.
 *
 * @param userOptions - Partial user-provided plugin options
 * @returns Fully resolved and validated options object
 *
 * @example
 * ```typescript
 * const config = validatePluginConfig({ env: loadEnv(...), scanConfigFiles: true });
 * // config.configFilePattern === ['src/**\/*.config.ts', 'config/**\/*.config.ts']
 * // config.enableHMR === true
 * ```
 */
export function validatePluginConfig(
  userOptions?: Partial<ViteConfigPluginOptions>
): Required<ViteConfigPluginOptions> {
  const config = { ...DEFAULT_PLUGIN_OPTIONS };

  if (userOptions) {
    Object.assign(config, userOptions);
  }

  // ── Config file patterns ─────────────────────────────────────────────

  if (!config.configFilePattern) {
    config.configFilePattern = DEFAULT_PLUGIN_OPTIONS.configFilePattern;
  }
  if (!Array.isArray(config.configFilePattern)) {
    config.configFilePattern = [config.configFilePattern];
  }

  // ── Exclude dirs ─────────────────────────────────────────────────────

  if (!config.excludeDirs) {
    config.excludeDirs = DEFAULT_PLUGIN_OPTIONS.excludeDirs;
  }

  // ── Include list ─────────────────────────────────────────────────────

  if (!config.include) {
    config.include = [];
  }

  return config as Required<ViteConfigPluginOptions>;
}
