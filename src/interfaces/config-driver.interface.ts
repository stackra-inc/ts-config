/**
 * Configuration Driver Interface
 *
 * Defines the contract that all configuration drivers must implement.
 * Each driver is responsible for loading configuration from a specific
 * source (environment variables, files, remote services, etc.) and
 * providing uniform access to the loaded values.
 *
 * @module interfaces/config-driver
 */

export interface ConfigDriver {
  /**
   * Load configuration from the driver's source.
   *
   * Implementations may load synchronously (e.g., `import.meta.env`) or
   * asynchronously (e.g., remote config services). Consumers should
   * always `await` the result.
   *
   * @returns The full configuration object, or a promise resolving to it
   *
   * @example
   * ```typescript
   * const config = await driver.load();
   * ```
   */
  load(): Promise<Record<string, any>> | Record<string, any>;

  /**
   * Get a configuration value by key.
   *
   * Supports dot-notation for nested values (e.g., `'database.host'`).
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key (supports dot notation)
   * @param defaultValue - Default value if the key is not found
   * @returns The value cast to `T`, or `defaultValue` if missing
   *
   * @example
   * ```typescript
   * const host = driver.get<string>('database.host', 'localhost');
   * ```
   */
  get<T = any>(key: string, defaultValue?: T): T | undefined;

  /**
   * Check if a configuration key exists.
   *
   * @param key - Configuration key (supports dot notation)
   * @returns `true` if the key exists in the loaded configuration
   *
   * @example
   * ```typescript
   * if (driver.has('database.host')) {
   *   // key is present
   * }
   * ```
   */
  has(key: string): boolean;

  /**
   * Get all configuration values as a plain object.
   *
   * @returns A copy of the full configuration key-value map
   *
   * @example
   * ```typescript
   * const all = driver.all();
   * console.log(Object.keys(all));
   * ```
   */
  all(): Record<string, any>;
}
