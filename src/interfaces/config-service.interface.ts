/**
 * Configuration Service Interface
 *
 * Defines the contract for configuration service implementations.
 * Provides typed getters for common value types (string, number, boolean,
 * array, JSON) along with "or throw" variants for required values.
 *
 * @module interfaces/config-service
 */

export interface ConfigServiceInterface {
  /**
   * Get a configuration value by key.
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key (supports dot notation)
   * @param defaultValue - Fallback value if the key is not found
   * @returns The value cast to `T`, or `defaultValue` if missing
   */
  get<T = any>(key: string, defaultValue?: T): T | undefined;

  /**
   * Get a configuration value or throw if not found.
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key
   * @returns The configuration value
   * @throws Error if the key is not set
   */
  getOrThrow<T = any>(key: string): T;

  /**
   * Get a string configuration value.
   *
   * @param key - Configuration key
   * @param defaultValue - Fallback string value
   * @returns The string value, or `defaultValue` if not found
   */
  getString(key: string, defaultValue?: string): string | undefined;

  /**
   * Get a string configuration value or throw if not found.
   *
   * @param key - Configuration key
   * @returns The string value
   * @throws Error if the key is not set
   */
  getStringOrThrow(key: string): string;

  /**
   * Get a numeric configuration value.
   *
   * Parses string values to numbers. Returns `defaultValue` if
   * the value cannot be parsed.
   *
   * @param key - Configuration key
   * @param defaultValue - Fallback number value
   * @returns The numeric value, or `defaultValue` if not found/unparseable
   */
  getNumber(key: string, defaultValue?: number): number | undefined;

  /**
   * Get a numeric configuration value or throw if not found.
   *
   * @param key - Configuration key
   * @returns The numeric value
   * @throws Error if the key is not set
   */
  getNumberOrThrow(key: string): number;

  /**
   * Get a boolean configuration value.
   *
   * Treats `'true'`, `'1'`, `'yes'`, `'on'` as `true`.
   * All other string values are treated as `false`.
   *
   * @param key - Configuration key
   * @param defaultValue - Fallback boolean value
   * @returns The boolean value, or `defaultValue` if not found
   */
  getBool(key: string, defaultValue?: boolean): boolean | undefined;

  /**
   * Get a boolean configuration value or throw if not found.
   *
   * @param key - Configuration key
   * @returns The boolean value
   * @throws Error if the key is not set
   */
  getBoolOrThrow(key: string): boolean;

  /**
   * Get an array configuration value.
   *
   * Splits comma-separated strings into arrays. If the value is
   * already an array, it's returned as-is (stringified).
   *
   * @param key - Configuration key
   * @param defaultValue - Fallback array value
   * @returns The array value, or `defaultValue` if not found
   */
  getArray(key: string, defaultValue?: string[]): string[] | undefined;

  /**
   * Get a JSON configuration value.
   *
   * Parses JSON strings into objects. If the value is already
   * an object, it's returned as-is.
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key
   * @param defaultValue - Fallback value if parsing fails
   * @returns The parsed JSON value, or `defaultValue` on failure
   */
  getJson<T = any>(key: string, defaultValue?: T): T | undefined;

  /**
   * Check if a configuration key exists.
   *
   * @param key - Configuration key (supports dot notation)
   * @returns `true` if the key exists in the configuration
   */
  has(key: string): boolean;

  /**
   * Get all configuration values as a plain object.
   *
   * @returns A copy of all configuration key-value pairs
   */
  all(): Record<string, any>;

  /**
   * Set a configuration value at runtime.
   *
   * Creates a runtime override that takes precedence over the driver's
   * value. Useful for feature flags, A/B tests, or test fixtures.
   *
   * @param key - Configuration key
   * @param value - The value to set
   * @returns `this` for chaining
   */
  set(key: string, value: any): this;

  /**
   * Remove a runtime override, reverting to the driver's value.
   *
   * @param key - Configuration key to unset
   * @returns `this` for chaining
   */
  unset(key: string): this;

  /**
   * Mark one or more keys as sensitive.
   *
   * Sensitive keys are redacted in `toSafeObject()` output.
   *
   * @param keys - Key(s) to mark as sensitive
   * @returns `this` for chaining
   */
  markSensitive(...keys: string[]): this;

  /**
   * Get all configuration values with sensitive keys redacted.
   *
   * Returns a copy of `all()` where keys marked as sensitive
   * have their values replaced with a placeholder string.
   *
   * @param redactValue - Custom redaction placeholder
   *   (default: `'[REDACTED]'`)
   * @returns A redacted copy of all configuration key-value pairs
   */
  toSafeObject(redactValue?: string): Record<string, any>;

  /**
   * Clear all runtime overrides.
   *
   * Reverts all values to the driver's original configuration.
   *
   * @returns void
   */
  clearCache(): void;
}
