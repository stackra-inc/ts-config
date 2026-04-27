/**
 * Plugin Config Builder Utility
 *
 * Builds the final merged configuration object from environment variables
 * and scanned config files. Used by the Vite plugin to produce the
 * configuration that gets served via the virtual module.
 *
 * @module utils/build-plugin-config
 */

import path from 'path';

import { loadConfigFile } from './load-config-file.util';
import { scanConfigFiles } from './scan-config-files.util';
import type { ViteConfigPluginOptions } from '@/interfaces/vite-config-plugin-options.interface';

/**
 * Result of building the plugin configuration.
 *
 * Contains the merged config object and the set of scanned file paths
 * (used by HMR to detect relevant file changes).
 */
export interface BuildResult {
  /**
   * The merged configuration object (env + scanned files).
   */
  config: Record<string, any>;

  /**
   * Absolute paths of all scanned config files.
   * Used by `handleHotUpdate` to detect relevant changes.
   */
  scannedFiles: Set<string>;
}

/**
 * Build the merged configuration from env vars and scanned config files.
 *
 * 1. Filters env vars based on `includeAll` / `include` options
 * 2. Optionally scans for `.config.ts` files and loads them
 * 3. Merges everything into a single config object
 *
 * @param options - Validated plugin options
 * @param root - Project root directory (from Vite's resolved config)
 * @returns The merged config and set of scanned file paths
 *
 * @example
 * ```typescript
 * const { config, scannedFiles } = await buildPluginConfig(options, '/my-project');
 * // config = { APP_NAME: 'MyApp', database: { host: 'localhost' } }
 * // scannedFiles = Set { '/my-project/config/database.config.ts' }
 * ```
 */
export async function buildPluginConfig(
  options: Required<ViteConfigPluginOptions>,
  root: string
): Promise<BuildResult> {
  const scannedFiles = new Set<string>();

  // ── Filter env vars ──────────────────────────────────────────────────

  const envConfig: Record<string, any> = {};

  for (const [key, value] of Object.entries(options.env)) {
    if (!options.includeAll && !options.include.includes(key)) {
      continue;
    }
    envConfig[key] = value;
  }

  // ── Scan config files ────────────────────────────────────────────────

  let fileConfig: Record<string, any> = {};

  if (options.scanConfigFiles) {
    const configFiles = await scanConfigFiles({
      ...options,
      root,
    });

    if (options.debug) {
      console.debug(`[vite-plugin-config] Found ${configFiles.length} config files`);
    }

    for (const file of configFiles) {
      try {
        const loaded = await loadConfigFile(file);
        fileConfig = { ...fileConfig, ...loaded };
        scannedFiles.add(file);

        if (options.debug) {
          console.debug(`[vite-plugin-config] Loaded: ${path.relative(root, file)}`);
        }
      } catch (error) {
        console.warn(`[vite-plugin-config] Failed to load: ${file}`, error);
      }
    }
  }

  // ── Merge ────────────────────────────────────────────────────────────

  const config = { ...envConfig, ...fileConfig };

  if (options.debug) {
    console.debug(`[vite-plugin-config] Built config with ${Object.keys(config).length} keys`);
  }

  return { config, scannedFiles };
}
