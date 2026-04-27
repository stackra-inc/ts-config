/**
 * Vite Plugin for Config Package
 *
 * Serves configuration via a virtual module (`virtual:@stackra/ts-config`)
 * with full HMR support. Merges Vite's `loadEnv()` output with scanned
 * `.config.ts` files and exposes the result as an importable module.
 *
 * This plugin is a thin adapter — it wires Vite lifecycle hooks to
 * utility functions that handle validation, scanning, building, and
 * virtual module generation.
 *
 * ## How It Works
 *
 * ```
 * vite.config.ts
 *   └── viteConfigPlugin({ env: loadEnv(...) })
 *         ├── configResolved → validatePluginConfig + buildPluginConfig
 *         ├── resolveId/load → serves virtual module
 *         ├── transformIndexHtml → injects window.__APP_CONFIG__ fallback
 *         └── handleHotUpdate → re-builds + invalidates virtual module
 * ```
 *
 * @module plugins/vite
 */

import path from 'path';
import type { Plugin } from 'vite';
import { Str } from '@stackra/ts-support';

import { validatePluginConfig } from '@/utils/validate-plugin-config.util';
import { generateVirtualModule } from '@/utils/generate-virtual-module.util';
import { buildPluginConfig, type BuildResult } from '@/utils/build-plugin-config.util';
import type { ViteConfigPluginOptions } from '@/interfaces/vite-config-plugin-options.interface';

/**
 * Virtual module ID that consumers import from.
 *
 * @example
 * ```typescript
 * import { config, get, has } from 'virtual:@stackra/ts-config';
 * ```
 */
const VIRTUAL_MODULE_ID = 'virtual:@stackra/ts-config';

/**
 * Vite-internal resolved ID (prefixed with `\0` to mark as virtual).
 */
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

/**
 * Create a Vite plugin that serves configuration via a virtual module.
 *
 * Validates options, scans for config files, builds the merged config,
 * and exposes it through a virtual module. Also injects a
 * `window.__APP_CONFIG__` fallback in the HTML for `EnvDriver`
 * compatibility. Supports HMR for config file changes during dev.
 *
 * @param options - Partial plugin configuration (merged with defaults)
 * @returns Configured Vite {@link Plugin} instance
 *
 * @example
 * ```typescript
 * import { defineConfig, loadEnv } from 'vite';
 * import { viteConfigPlugin } from '@stackra/ts-config/vite-plugin';
 *
 * export default defineConfig(({ mode }) => {
 *   const env = loadEnv(mode, 'environments', '');
 *
 *   return {
 *     plugins: [
 *       viteConfigPlugin({
 *         env,
 *         scanConfigFiles: true,
 *       }),
 *     ],
 *   };
 * });
 * ```
 */
export function viteConfigPlugin(options?: Partial<ViteConfigPluginOptions>): Plugin {
  const config = validatePluginConfig(options);

  /**
   * Cached build artifacts — prevents re-scanning on every module request.
   */
  let buildResult: BuildResult | null = null;
  let virtualModuleCode: string | null = null;

  return {
    name: 'vite-plugin-config',
    enforce: 'pre',

    /**
     * Scan config files and build the virtual module at startup.
     */
    async configResolved(resolvedConfig) {
      buildResult = await buildPluginConfig(config, resolvedConfig.root);
      virtualModuleCode = generateVirtualModule(buildResult.config, config.globalName);

      if (config.debug) {
        console.debug('[vite-plugin-config] Build complete');
      }
    },

    /**
     * Resolve the virtual module ID so Vite knows it is ours.
     *
     * @param id - Module specifier requested by an import statement
     * @returns Resolved virtual ID, or `null` for unrelated modules
     */
    resolveId(id: string): string | null {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
      return null;
    },

    /**
     * Serve the generated virtual module code.
     *
     * @param id - Resolved module ID
     * @returns Generated source, or `null` for unrelated modules
     * @throws Error if the virtual module has not been initialized yet
     */
    load(id: string): string | null {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        if (!virtualModuleCode) {
          throw new Error(
            '[vite-plugin-config] Virtual module not initialized. ' +
              'Make sure configResolved was called.'
          );
        }
        return virtualModuleCode;
      }
      return null;
    },

    /**
     * Inject `window.__APP_CONFIG__` into HTML as a fallback.
     *
     * Ensures `EnvDriver` works even if the consumer doesn't
     * import the virtual module directly.
     */
    transformIndexHtml() {
      if (!buildResult) return [];

      return [
        {
          tag: 'script',
          attrs: { type: 'application/javascript' },
          children: `window.${config.globalName} = ${JSON.stringify(buildResult.config)};`,
          injectTo: 'head-prepend' as const,
        },
      ];
    },

    /**
     * Handle HMR for config file changes.
     *
     * When a scanned config file is edited during dev, re-scans all
     * files, regenerates the virtual module, invalidates Vite's
     * module graph, and triggers a full page reload.
     */
    async handleHotUpdate({ file, server }) {
      if (!config.enableHMR || !buildResult) return;

      // Check if the changed file is a known config file or matches the pattern
      const isKnownFile = buildResult.scannedFiles.has(file);
      const isConfigFile =
        Str.endsWith(file, '.config.ts') ||
        Str.endsWith(file, '.config.js') ||
        Str.endsWith(file, '.config.mts') ||
        Str.endsWith(file, '.config.mjs');

      if (!isKnownFile && !isConfigFile) return;

      if (config.debug) {
        console.debug(`[vite-plugin-config] HMR: ${path.basename(file)} changed`);
      }

      try {
        // Re-scan and rebuild
        buildResult = await buildPluginConfig(config, server.config.root);
        virtualModuleCode = generateVirtualModule(buildResult.config, config.globalName);

        // Invalidate the virtual module in Vite's module graph
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
        }

        // Config changes are global — trigger full reload
        server.ws.send({ type: 'full-reload' });

        if (config.debug) {
          console.debug('[vite-plugin-config] HMR: Rebuild complete, full reload triggered');
        }
      } catch (error) {
        console.error('[vite-plugin-config] HMR error:', error);
      }
    },
  };
}
