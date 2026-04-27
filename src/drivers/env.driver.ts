/**
 * Environment Variable Configuration Driver
 *
 * Loads configuration from environment variables (`import.meta.env`) or a
 * browser-injected global (`window.__APP_CONFIG__`). Supports automatic
 * framework prefix stripping (Vite, Next.js) and variable expansion
 * (`${VAR}` syntax).
 *
 * In browser environments, the Vite plugin injects env vars into
 * `window.__APP_CONFIG__` — this driver reads from there.
 * In Node.js, it reads directly from `import.meta.env`.
 *
 * ## Architecture
 *
 * ```
 * EnvDriver
 *   ├── stripPrefix()        — auto-detects and strips VITE_ / NEXT_PUBLIC_
 *   └── expandEnvVariables() — resolves ${VAR} references
 * ```
 *
 * @module drivers/env
 */

import { Str } from '@stackra/ts-support';
import type { ConfigDriver } from '@/interfaces';
import { getNestedValue, hasNestedValue } from '@/utils';

/**
 * EnvDriver — reads configuration from environment variables.
 *
 * Works in both Node.js (`import.meta.env`) and browser environments
 * (`window.__APP_CONFIG__`). The browser global is typically injected
 * by the Vite config plugin at build time.
 *
 * @example
 * ```typescript
 * const driver = new EnvDriver({
 *   envPrefix: 'VITE_',
 *   expandVariables: true,
 * });
 * driver.load();
 *
 * const appName = driver.get('APP_NAME', 'MyApp');
 * ```
 */
export class EnvDriver implements ConfigDriver {
  /**
   * Internal configuration store.
   * Populated after the first call to `load()`.
   */
  private config: Record<string, any> = {};

  /**
   * Guard flag to prevent redundant loads.
   * Once `true`, subsequent `load()` calls return the cached config.
   */
  private loaded = false;

  /**
   * Create a new EnvDriver.
   *
   * @param options - Driver configuration
   * @param options.expandVariables - Resolve `${VAR}` references in values
   *   (default: `false`)
   * @param options.envPrefix - Prefix to strip from keys, `'auto'` to
   *   auto-detect, or `false` to disable (default: `'auto'`)
   * @param options.globalName - Browser global variable name to read config
   *   from (default: `'__APP_CONFIG__'`)
   * @param options.debug - Enable debug logging (default: `false`)
   */
  constructor(
    private options: {
      expandVariables?: boolean;
      envPrefix?: string | false;
      globalName?: string;
      debug?: boolean;
    } = {}
  ) {}

  /**
   * Load environment variables into the internal config store.
   *
   * On first call, reads from the browser global (`window[globalName]`) or
   * `import.meta.env`, applies prefix stripping and variable expansion, then
   * caches the result. Subsequent calls return the cached config immediately.
   *
   * @returns The full configuration object
   *
   * @example
   * ```typescript
   * const driver = new EnvDriver({ envPrefix: 'VITE_' });
   * const config = driver.load();
   * ```
   */
  load(): Record<string, any> {
    if (this.loaded) {
      return this.config;
    }

    const globalName = this.options.globalName || '__APP_CONFIG__';

    // Try browser global first, then import.meta.env
    if (typeof window !== 'undefined' && (window as any)[globalName]) {
      this.config = { ...(window as any)[globalName] };
      this.log(`Loaded config from window.${globalName}: ${Object.keys(this.config).length} keys`);
    } else if (typeof process !== 'undefined' && process.env) {
      this.config = { ...process.env };
      this.log(`Loaded config from import.meta.env: ${Object.keys(this.config).length} keys`);
    } else {
      this.warn(`No config source available (neither window.${globalName} nor import.meta.env)`);
      this.config = {};
    }

    // Strip prefix if configured
    if (this.options.envPrefix !== false) {
      this.stripPrefix();
    }

    // Expand variables if enabled
    if (this.options.expandVariables) {
      this.expandEnvVariables();
    }

    this.loaded = true;
    return this.config;
  }

  /**
   * Get a configuration value by key.
   *
   * Lazily triggers `load()` if the driver hasn't been loaded yet.
   * Supports dot-notation for nested values.
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key (supports dot notation, e.g. `'database.host'`)
   * @param defaultValue - Fallback value if the key is not found
   * @returns The configuration value cast to `T`, or `defaultValue` if missing
   *
   * @example
   * ```typescript
   * const host = driver.get<string>('DB_HOST', 'localhost');
   * ```
   */
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    if (!this.loaded) {
      this.load();
    }
    return getNestedValue(this.config, key, defaultValue);
  }

  /**
   * Check if a configuration key exists.
   *
   * Lazily triggers `load()` if the driver hasn't been loaded yet.
   *
   * @param key - Configuration key (supports dot notation)
   * @returns `true` if the key exists in the loaded configuration
   *
   * @example
   * ```typescript
   * if (driver.has('DB_HOST')) {
   *   // key is present
   * }
   * ```
   */
  has(key: string): boolean {
    if (!this.loaded) {
      this.load();
    }
    return hasNestedValue(this.config, key);
  }

  /**
   * Get all configuration values as a plain object.
   *
   * Lazily triggers `load()` if the driver hasn't been loaded yet.
   * Returns a shallow copy to prevent external mutation.
   *
   * @returns A shallow copy of the full configuration object
   *
   * @example
   * ```typescript
   * const allConfig = driver.all();
   * console.log(Object.keys(allConfig));
   * ```
   */
  all(): Record<string, any> {
    if (!this.loaded) {
      this.load();
    }
    return { ...this.config };
  }

  // ── Mutation ─────────────────────────────────────────────────────────────

  /**
   * Merge additional configuration into the internal store.
   *
   * Used by `ConfigModule` to merge custom `load` config on top
   * of the driver's loaded values.
   *
   * @param config - Configuration object to merge
   *
   * @example
   * ```typescript
   * driver.merge({ APP_NAME: 'MyApp', DB_PORT: 5432 });
   * ```
   */
  merge(config: Record<string, any>): void {
    Object.assign(this.config, config);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Expand `${VAR}` references within configuration values.
   *
   * Scans all string values for `${...}` patterns and replaces them
   * with the corresponding config value. Missing references resolve
   * to an empty string.
   *
   * @returns void
   */
  private expandEnvVariables(): void {
    const regex = /\$\{([^}]+)\}/g;

    const expand = (value: string): string => {
      return value.replace(regex, (_, key) => {
        return this.config[key] || '';
      });
    };

    for (const [key, value] of Object.entries(this.config)) {
      if (typeof value === 'string' && value.includes('${')) {
        this.config[key] = expand(value);
      }
    }
  }

  /**
   * Strip environment variable prefixes from configuration keys.
   *
   * Auto-detects the framework prefix (`VITE_`, `NEXT_PUBLIC_`) when
   * `envPrefix` is `'auto'` or `undefined`. Adds both the prefixed and
   * unprefixed versions of each key to the config so consumers can use
   * either form.
   *
   * @returns void
   */
  private stripPrefix(): void {
    let prefix = this.options.envPrefix;

    // Auto-detect framework prefix
    if (prefix === 'auto' || prefix === undefined) {
      const keys = Object.keys(this.config);
      const hasViteVars = keys.some((key) => Str.startsWith(key, 'VITE_'));

      if (hasViteVars || typeof import.meta !== 'undefined') {
        prefix = 'VITE_';
      } else if (keys.some((key) => Str.startsWith(key, 'NEXT_PUBLIC_'))) {
        prefix = 'NEXT_PUBLIC_';
      } else {
        return;
      }
    }

    if (typeof prefix === 'string' && prefix.length > 0) {
      const newConfig: Record<string, any> = {};

      for (const [key, value] of Object.entries(this.config)) {
        if (Str.startsWith(key, prefix)) {
          const unprefixedKey = key.substring(prefix.length);
          newConfig[unprefixedKey] = value;
          newConfig[key] = value; // Keep original too
        } else {
          newConfig[key] = value;
        }
      }

      this.config = newConfig;
    }
  }

  // ── Logging ──────────────────────────────────────────────────────────────

  /**
   * Log a debug message if debug mode is enabled.
   *
   * @param message - Message to log
   */
  private log(message: string): void {
    if (this.options.debug) {
      console.debug(`[EnvDriver] ${message}`);
    }
  }

  /**
   * Log a warning message (always emitted).
   *
   * @param message - Warning message
   */
  private warn(message: string): void {
    console.warn(`[EnvDriver] ${message}`);
  }
}
