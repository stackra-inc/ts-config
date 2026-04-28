/**
 * Vite Plugin Entry Point
 *
 * Separate entry point for the Vite config plugin, consumed as:
 * `import { viteConfigPlugin } from '@stackra/ts-config/vite'`
 *
 * Re-exports the plugin factory and its options type so consumers
 * don't need to reach into internal paths.
 *
 * @module vite
 */

export { viteConfigPlugin } from './plugins/vite.plugin';
export type { ViteConfigPluginOptions } from './interfaces/vite-config-plugin-options.interface';
