/**
 * Scan Config Files Utility
 *
 * Discovers all `.config.ts` files matching a glob pattern within a
 * project directory. Uses `fast-glob` for fast and reliable file
 * discovery, following the same pattern as the i18n package.
 *
 * @module utils/scan-config-files
 */

import type { ViteConfigPluginOptions } from '@/interfaces/vite-config-plugin-options.interface';

/**
 * Scan the filesystem for configuration files matching a glob pattern.
 *
 * Resolves glob patterns relative to `options.root` (defaults to `cwd`),
 * excludes common non-source directories, and returns absolute paths.
 *
 * @param options - Plugin options containing scan configuration
 * @param options.configFilePattern - Glob pattern(s) to match
 *   (default: `'src/**\/*.config.ts'`)
 * @param options.excludeDirs - Directories to exclude from scanning
 *   (default: `['node_modules', 'dist', 'build', '.git']`)
 * @param options.root - Root directory for scanning
 *   (default: `process.cwd()`)
 * @returns Array of absolute file paths to discovered config files
 *
 * @example
 * ```typescript
 * const files = await scanConfigFiles({
 *   configFilePattern: 'src/**\/*.config.ts',
 *   root: '/my-project',
 * });
 * // ['/my-project/src/database.config.ts', '/my-project/src/cache.config.ts']
 * ```
 */
export async function scanConfigFiles(options: ViteConfigPluginOptions): Promise<string[]> {
  const {
    configFilePattern = 'src/**/*.config.ts',
    excludeDirs = ['node_modules', 'dist', 'build', '.git'],
    root = process.cwd(),
  } = options;

  // Dynamic import to avoid bundling fast-glob when not used
  const fg = await import('fast-glob');

  const patterns = Array.isArray(configFilePattern) ? configFilePattern : [configFilePattern];
  const ignore = excludeDirs.map((dir: string) => `**/${dir}/**`);
  const configFiles: string[] = [];

  for (const pattern of patterns) {
    const files = await fg.default.glob(pattern, {
      cwd: root,
      absolute: true,
      ignore,
    });
    configFiles.push(...files);
  }

  return configFiles;
}
