/**
 * Configuration Module Options
 *
 * Defines the shape of the options object passed to `ConfigModule.forRoot()`.
 * Follows the multi-driver pattern used by cache, logger, and redis packages.
 *
 * The `default` field selects which named source to use when no name is
 * specified, and `sources` maps names to their driver configurations.
 *
 * @module interfaces/config-module-options
 */

import type { HttpDriverOptions } from './http-driver-options.interface';

/**
 * Configuration for a single named config source.
 *
 * The `driver` field acts as the discriminant, determining which
 * driver implementation is used to load configuration.
 *
 * @example
 * ```typescript
 * // Env source
 * const envSource: ConfigSourceOptions = {
 *   driver: 'env',
 *   envPrefix: 'VITE_',
 * };
 *
 * // HTTP source
 * const httpSource: ConfigSourceOptions = {
 *   driver: 'http',
 *   http: { url: '/api/config' },
 * };
 * ```
 */
export interface ConfigSourceOptions {
  /**
   * Configuration driver to use for this source.
   *
   * - `'env'` — reads from `import.meta.env` or browser global
   * - `'file'` — reads from TypeScript/JavaScript/JSON config files
   * - `'http'` — fetches from a remote HTTP endpoint
   *
   * @default 'env'
   */
  driver: 'env' | 'file' | 'http' | string;

  // ── Env driver options ─────────────────────────────────────────────────

  /**
   * Whether to expand `${VAR}` references in values.
   *
   * @default false
   */
  expandVariables?: boolean;

  /**
   * Environment variable prefix to strip.
   *
   * - `'auto'` — auto-detect (`VITE_` for Vite, `NEXT_PUBLIC_` for Next.js)
   * - A string — strip that exact prefix
   * - `false` — disable prefix stripping
   *
   * @default 'auto'
   */
  envPrefix?: 'auto' | 'VITE_' | 'NEXT_PUBLIC_' | string | false;

  /**
   * Global variable name to read config from in browser.
   *
   * @default '__APP_CONFIG__'
   */
  globalName?: string;

  // ── File driver options ────────────────────────────────────────────────

  /**
   * Glob pattern(s) to scan for config files (for file driver).
   *
   * @default 'src/**\/*.config.ts'
   */
  filePattern?: string | string[];

  /**
   * Root directory for config file scanning.
   *
   * @default process.cwd()
   */
  fileRoot?: string;

  /**
   * Directories to exclude from config file scanning.
   *
   * @default ['node_modules', 'dist', 'build', '.git']
   */
  fileExcludeDirs?: string[];

  /**
   * Pre-loaded configuration object (for file driver in browser).
   *
   * When provided, the file driver skips scanning and uses this
   * object directly.
   */
  config?: Record<string, any>;

  // ── HTTP driver options ────────────────────────────────────────────────

  /**
   * HTTP driver options (for `driver: 'http'`).
   *
   * @see {@link HttpDriverOptions}
   */
  http?: HttpDriverOptions;

  // ── Shared options ─────────────────────────────────────────────────────

  /**
   * Custom configuration object or async factory to merge on top
   * of the driver's loaded configuration.
   */
  load?: Record<string, any> | (() => Record<string, any> | Promise<Record<string, any>>);
}

/**
 * Main configuration object for the config module.
 *
 * Defines the default source and all available source configurations.
 * Follows the same pattern as `CacheModuleOptions` and `LoggerModuleOptions`.
 *
 * @example
 * ```typescript
 * const config: ConfigModuleOptions = {
 *   default: 'env',
 *   sources: {
 *     env: {
 *       driver: 'env',
 *       envPrefix: 'auto',
 *     },
 *     api: {
 *       driver: 'http',
 *       http: { url: '/api/config' },
 *     },
 *   },
 * };
 * ```
 */
export interface ConfigModuleOptions {
  /**
   * Default config source name.
   *
   * This source will be used when no specific source is requested.
   * Must match one of the keys in the `sources` object.
   *
   * @default 'env'
   */
  default: string;

  /**
   * Config source configurations.
   *
   * Object mapping source names to their driver configurations.
   * Each source can use a different driver and have different settings.
   *
   * @example
   * ```typescript
   * {
   *   env: { driver: 'env', envPrefix: 'auto' },
   *   file: { driver: 'file', filePattern: 'config/**\/*.config.ts' },
   *   api: { driver: 'http', http: { url: '/api/config' } },
   * }
   * ```
   */
  sources: Record<string, ConfigSourceOptions>;

  /**
   * Whether configuration is global (available to all modules).
   *
   * @default true
   */
  isGlobal?: boolean;

  /**
   * Validate configuration after loading.
   *
   * Called with the full merged config object from the default source.
   * Throw an error to reject invalid configuration.
   *
   * @param config - The loaded configuration object
   * @throws Error if validation fails
   */
  validate?: (config: Record<string, any>) => void | Promise<void>;

  /**
   * Enable debug logging for driver operations.
   *
   * @default false
   */
  debug?: boolean;

  /**
   * Keys to mark as sensitive across all sources.
   *
   * Sensitive keys are redacted in `ConfigService.toSafeObject()`,
   * preventing accidental exposure in logs, error reports, or dumps.
   *
   * @default []
   *
   * @example
   * ```typescript
   * {
   *   sensitiveKeys: ['JWT_SECRET', 'DB_PASSWORD', 'API_KEY', 'STRIPE_SECRET'],
   * }
   * ```
   */
  sensitiveKeys?: string[];
}
