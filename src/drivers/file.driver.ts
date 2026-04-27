/**
 * File-based Configuration Driver
 *
 * Loads configuration from TypeScript/JavaScript/JSON config files.
 * Supports two modes:
 *
 * 1. Pre-loaded config via constructor (browser / Vite plugin)
 * 2. File scanning via glob patterns (Node.js / server-side)
 *
 * Uses `fast-glob` for file discovery and `readFileSync` / dynamic
 * `import()` for loading, following the same pattern as the i18n package.
 *
 * @module drivers/file
 */

import { Str } from '@stackra/ts-support';
import type { ConfigDriver } from '@/interfaces/config-driver.interface';
import { getNestedValue, hasNestedValue } from '@/utils/get-nested-value.util';

/**
 * FileDriver — reads configuration from config files or pre-loaded objects.
 *
 * When `options.config` is provided, the driver is immediately ready.
 * When `options.filePattern` is provided, `load()` scans the filesystem
 * and merges all discovered config files.
 *
 * @example
 * ```typescript
 * // Pre-loaded config (browser)
 * const driver = new FileDriver({
 *   config: { database: { host: 'localhost', port: 5432 } },
 * });
 *
 * // File scanning (Node.js)
 * const driver = new FileDriver({
 *   filePattern: 'config/**\/*.config.ts',
 *   root: process.cwd(),
 * });
 * await driver.load();
 *
 * const host = driver.get('database.host'); // 'localhost'
 * ```
 */
export class FileDriver implements ConfigDriver {
  /**
   * Internal configuration store.
   * Populated from the constructor options or after `load()`.
   */
  private config: Record<string, any> = {};

  /**
   * Guard flag indicating whether configuration has been loaded.
   * Set to `true` immediately if config is passed via constructor.
   */
  private loaded = false;

  /**
   * Create a new FileDriver.
   *
   * If `options.config` is provided, the driver is immediately marked
   * as loaded and ready for use without calling `load()`.
   *
   * @param options - Driver configuration
   * @param options.config - Pre-loaded configuration object
   * @param options.filePattern - Glob pattern(s) to scan for config files
   * @param options.root - Root directory for file scanning
   *   (default: `process.cwd()`)
   * @param options.excludeDirs - Directories to exclude from scanning
   *   (default: `['node_modules', 'dist', 'build', '.git']`)
   * @param options.debug - Enable debug logging (default: `false`)
   */
  constructor(
    private readonly options: {
      config?: Record<string, any>;
      filePattern?: string | string[];
      root?: string;
      excludeDirs?: string[];
      debug?: boolean;
    } = {}
  ) {
    if (options.config) {
      this.config = options.config;
      this.loaded = true;
    }
  }

  /**
   * Load configuration from files or return pre-loaded config.
   *
   * When `filePattern` is set, scans the filesystem using `fast-glob`,
   * loads each discovered file (JSON via `readFileSync`, JS/TS via
   * dynamic `import()`), and merges them into a single config object.
   *
   * @returns The full configuration object
   * @throws Error if running on the server without pre-loaded config
   *   and no `filePattern` is provided
   *
   * @example
   * ```typescript
   * const driver = new FileDriver({ filePattern: 'config/**\/*.config.ts' });
   * const config = await driver.load();
   * ```
   */
  async load(): Promise<Record<string, any>> {
    if (this.loaded) {
      return this.config;
    }

    // If filePattern is provided, scan and load files
    if (this.options.filePattern) {
      await this.scanAndLoadFiles();
      this.loaded = true;
      return this.config;
    }

    // No config source — check if we're on the server
    const isServer =
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as typeof globalThis & { window?: any }).window === 'undefined';

    if (isServer) {
      throw new Error(
        'FileDriver requires either pre-loaded configuration (options.config) ' +
          'or a file pattern (options.filePattern) to scan.'
      );
    }

    this.loaded = true;
    return this.config;
  }

  /**
   * Get a configuration value by key.
   *
   * Supports dot-notation for nested values (e.g., `'database.host'`).
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key (supports dot notation)
   * @param defaultValue - Fallback value if the key is not found
   * @returns The configuration value cast to `T`, or `defaultValue` if missing
   * @throws Error if configuration has not been loaded yet
   *
   * @example
   * ```typescript
   * const host = driver.get<string>('database.host', 'localhost');
   * ```
   */
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first or use async initialization.');
    }
    return getNestedValue(this.config, key, defaultValue);
  }

  /**
   * Check if a configuration key exists.
   *
   * @param key - Configuration key (supports dot notation)
   * @returns `true` if the key exists in the loaded configuration
   * @throws Error if configuration has not been loaded yet
   *
   * @example
   * ```typescript
   * if (driver.has('database.host')) {
   *   // key is present
   * }
   * ```
   */
  has(key: string): boolean {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first or use async initialization.');
    }
    return hasNestedValue(this.config, key);
  }

  /**
   * Get all configuration values as a plain object.
   *
   * Returns a shallow copy to prevent external mutation.
   *
   * @returns A shallow copy of the full configuration object
   * @throws Error if configuration has not been loaded yet
   *
   * @example
   * ```typescript
   * const allConfig = driver.all();
   * console.log(Object.keys(allConfig));
   * ```
   */
  all(): Record<string, any> {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first or use async initialization.');
    }
    return { ...this.config };
  }

  // ── Mutation ─────────────────────────────────────────────────────────────

  /**
   * Merge additional configuration into the internal store.
   *
   * @param config - Configuration object to merge
   */
  merge(config: Record<string, any>): void {
    Object.assign(this.config, config);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Scan the filesystem for config files and load them.
   *
   * Uses `fast-glob` for discovery and loads each file based on
   * its extension: JSON via `readFileSync`, JS/TS via `import()`.
   *
   * @returns void
   */
  private async scanAndLoadFiles(): Promise<void> {
    const {
      filePattern = 'src/**/*.config.ts',
      root = process.cwd(),
      excludeDirs = ['node_modules', 'dist', 'build', '.git'],
    } = this.options;

    // Dynamic import to avoid bundling fast-glob when not used
    const fg = await import('fast-glob');

    const patterns = Array.isArray(filePattern) ? filePattern : [filePattern];
    const ignore = excludeDirs.map((dir) => `**/${dir}/**`);

    for (const pattern of patterns) {
      const files = await fg.default.glob(pattern, {
        cwd: root,
        absolute: true,
        ignore,
      });

      this.log(`Found ${files.length} config files matching "${pattern}"`);

      for (const filePath of files) {
        try {
          const fileConfig = await this.loadSingleFile(filePath);
          this.config = { ...this.config, ...fileConfig };
          this.log(`Loaded config from: ${filePath}`);
        } catch (error) {
          console.warn(`[FileDriver] Failed to load config file: ${filePath}`, error);
        }
      }
    }
  }

  /**
   * Load and parse a single configuration file.
   *
   * - `.json` files are read synchronously and parsed via `JSON.parse`
   * - `.js` / `.ts` files are loaded via dynamic `import()` and the
   *   default export (or module object) is used
   * - If the resolved value is a function, it's called (supports factories)
   *
   * @param filePath - Absolute path to the config file
   * @returns The parsed configuration object
   */
  private async loadSingleFile(filePath: string): Promise<Record<string, any>> {
    const { extname, readFileSync } = await this.loadNodeModules();
    const ext = Str.lower(extname(filePath));

    if (ext === '.json') {
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }

    if (ext === '.js' || ext === '.ts' || ext === '.mjs' || ext === '.mts') {
      try {
        // @ts-ignore - Dynamic import path
        const mod = await import(/* @vite-ignore */ filePath);
        const config = mod.default || mod;
        // Support factory functions
        return typeof config === 'function' ? await config() : config;
      } catch (importError) {
        // Fallback: try reading as JSON-compatible content
        const content = readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
    }

    throw new Error(`Unsupported config file format: ${ext}`);
  }

  /**
   * Dynamically load Node.js built-in modules.
   *
   * Avoids bundling `fs` and `path` in browser builds.
   *
   * @returns Object with `extname` and `readFileSync` functions
   */
  private async loadNodeModules(): Promise<{
    extname: (p: string) => string;
    readFileSync: (p: string, encoding: string) => string;
  }> {
    const { extname } = await import('path');
    const { readFileSync } = await import('fs');
    return { extname, readFileSync: readFileSync as any };
  }

  /**
   * Log a debug message if debug mode is enabled.
   *
   * @param message - Message to log
   */
  private log(message: string): void {
    if (this.options.debug) {
      console.debug(`[FileDriver] ${message}`);
    }
  }
}
