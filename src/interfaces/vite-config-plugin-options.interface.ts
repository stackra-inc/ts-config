/**
 * Vite Config Plugin Options Interface
 *
 * Configuration options for the Vite config plugin that serves
 * configuration via a virtual module with HMR support.
 *
 * @module interfaces/vite-config-plugin-options
 */

export interface ViteConfigPluginOptions {
  /**
   * Environment variables loaded by Vite's `loadEnv`.
   *
   * Pass the result of `loadEnv(mode, envDir, '')` here.
   * These are merged with any scanned config files.
   */
  env?: Record<string, string>;

  /**
   * Scan and collect `.config.ts` files.
   *
   * When enabled, the plugin scans for config files matching
   * `configFilePattern` and merges their exports into the
   * configuration object.
   *
   * @default false
   */
  scanConfigFiles?: boolean;

  /**
   * Glob pattern(s) to match config files.
   *
   * @default ['src/**\/*.config.ts', 'config/**\/*.config.ts']
   */
  configFilePattern?: string | string[];

  /**
   * Directories to exclude from config file scanning.
   *
   * @default ['node_modules', 'dist', 'build', '.git']
   */
  excludeDirs?: string[];

  /**
   * Root directory for scanning config files.
   * Resolved from Vite's `config.root` at build time.
   *
   * @default process.cwd()
   */
  root?: string;

  /**
   * Include all environment variables.
   *
   * When `false`, only variables listed in `include` are exposed.
   *
   * @default true
   */
  includeAll?: boolean;

  /**
   * Specific environment variable keys to include.
   *
   * Only used when `includeAll` is `false`.
   */
  include?: string[];

  /**
   * Global variable name to inject config into.
   *
   * The virtual module exports the config under this name,
   * and also sets `window[globalName]` for backward compatibility.
   *
   * @default '__APP_CONFIG__'
   */
  globalName?: string;

  /**
   * Enable HMR for config file changes.
   *
   * When a scanned config file is edited during dev, the virtual
   * module is regenerated and consumers receive the update.
   *
   * @default true
   */
  enableHMR?: boolean;

  /**
   * Enable debug logging.
   *
   * @default false
   */
  debug?: boolean;
}
