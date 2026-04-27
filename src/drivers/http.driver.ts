/**
 * HTTP Configuration Driver
 *
 * Fetches configuration from a remote HTTP endpoint using
 * `@stackra/ts-http`'s `HttpClient`. Supports response transformation
 * and retry logic for resilient remote config loading.
 *
 * This driver is created internally by `ConfigManager.createDriverAsync()`
 * when a source is configured with `driver: 'http'`. The `HttpClient`
 * is injected into the manager via DI and passed to this driver.
 *
 * ## Use Cases
 *
 * - REST API config endpoints
 * - AWS AppConfig (via HTTP data plane)
 * - Firebase Remote Config (via REST API)
 * - Any JSON-over-HTTP config source
 *
 * @module drivers/http
 */

import type { HttpClient, HttpResponse } from '@stackra/ts-http';
import type { ConfigDriver } from '@/interfaces/config-driver.interface';
import type { HttpDriverOptions } from '@/interfaces/http-driver-options.interface';
import { getNestedValue, hasNestedValue } from '@/utils/get-nested-value.util';

/**
 * HttpDriver — fetches configuration from a remote HTTP endpoint.
 *
 * Requires an `HttpClient` instance (from `@stackra/ts-http`) and
 * options specifying the URL and optional response transform.
 *
 * @example
 * ```typescript
 * // Used via ConfigManager with DI
 * ConfigModule.forRoot({
 *   default: 'api',
 *   sources: {
 *     api: {
 *       driver: 'http',
 *       http: { url: '/api/config' },
 *     },
 *   },
 * });
 *
 * // Then access asynchronously
 * const apiConfig = await manager.sourceAsync('api');
 *
 * // Direct instantiation (e.g., in tests)
 * const driver = new HttpDriver(httpClient, {
 *   url: '/api/config',
 *   transform: (data) => data.settings,
 * });
 * await driver.load();
 * ```
 */
export class HttpDriver implements ConfigDriver {
  /**
   * Internal configuration store.
   * Populated after the first successful call to `load()`.
   */
  private config: Record<string, any> = {};

  /**
   * Guard flag to prevent redundant fetches.
   * Once `true`, subsequent `load()` calls return the cached config.
   */
  private loaded = false;

  /**
   * Create a new HttpDriver.
   *
   * @param httpClient - The `HttpClient` instance from `@stackra/ts-http`
   * @param options - Driver configuration (URL, transform, retries)
   */
  constructor(
    private readonly httpClient: HttpClient,
    private readonly options: HttpDriverOptions
  ) {}

  /**
   * Fetch configuration from the remote endpoint.
   *
   * On first call, sends a GET request to `options.url` via the injected
   * `HttpClient`, applies the optional `transform` function, and caches
   * the result. Subsequent calls return the cached config immediately.
   *
   * Supports retry logic: if `options.retries` is set, failed requests
   * are retried with a delay of `options.retryDelay` ms between attempts.
   *
   * @returns The fetched (and optionally transformed) configuration object
   * @throws Error if the request fails after all retry attempts
   *
   * @example
   * ```typescript
   * const driver = new HttpDriver(httpClient, { url: '/api/config' });
   * const config = await driver.load();
   * ```
   */
  async load(): Promise<Record<string, any>> {
    if (this.loaded) {
      return this.config;
    }

    const { url, transform, retries = 0, retryDelay = 1000 } = this.options;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response: HttpResponse<Record<string, any>> =
          await this.httpClient.get<Record<string, any>>(url);

        // Apply transform if provided, otherwise use raw data
        this.config = transform ? transform(response.data) : response.data;
        this.loaded = true;
        return this.config;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Wait before retrying (skip delay on last attempt)
        if (attempt < retries) {
          await this.delay(retryDelay);
        }
      }
    }

    throw new Error(
      `HttpDriver failed to fetch config from "${url}" after ${retries + 1} attempt(s): ${lastError?.message}`
    );
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
      throw new Error('Configuration not loaded. Call load() first.');
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
      throw new Error('Configuration not loaded. Call load() first.');
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
      throw new Error('Configuration not loaded. Call load() first.');
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
   * Sleep for a given number of milliseconds.
   *
   * @param ms - Milliseconds to wait
   * @returns A promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
