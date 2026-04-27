/**
 * Configuration Service
 *
 * The high-level API that consumers interact with. Wraps a `ConfigDriver`
 * and provides convenience methods for typed access: getString, getNumber,
 * getBool, getArray, getJson, etc.
 *
 * This class is NOT injectable directly — it's created internally by
 * `ConfigManager.source()`.
 *
 * @module services/config
 */

import { Str } from '@stackra/ts-support';
import type { ConfigDriver } from '@/interfaces/config-driver.interface';
import type { ConfigServiceInterface } from '@/interfaces/config-service.interface';

/**
 * ConfigService — the consumer-facing configuration API.
 *
 * Created by `ConfigManager.source(name)`. Wraps a `ConfigDriver`
 * with typed getters and "or throw" variants for required values.
 *
 * @example
 * ```typescript
 * const config = manager.source();
 * const host = config.getString('DB_HOST', 'localhost');
 * const port = config.getNumber('DB_PORT', 5432);
 * const ssl = config.getBool('DB_SSL', false);
 * const secret = config.getStringOrThrow('JWT_SECRET');
 * ```
 */
export class ConfigService implements ConfigServiceInterface {
  /**
   * The underlying configuration driver.
   */
  private readonly _driver: ConfigDriver;

  /**
   * Runtime overrides set via `set()`.
   * Takes precedence over driver values.
   */
  private readonly _overrides: Map<string, any> = new Map();

  /**
   * Keys marked as sensitive.
   * Redacted from `all()` and `toSafeObject()` output.
   */
  private readonly _sensitiveKeys: Set<string> = new Set();

  /**
   * Create a new ConfigService.
   *
   * @param driver - The configuration driver to wrap
   * @param sensitiveKeys - Optional list of keys to mark as sensitive
   *   (e.g., `['JWT_SECRET', 'DB_PASSWORD', 'API_KEY']`)
   */
  constructor(driver: ConfigDriver, sensitiveKeys?: string[]) {
    this._driver = driver;
    if (sensitiveKeys) {
      for (const key of sensitiveKeys) {
        this._sensitiveKeys.add(key);
      }
    }
  }

  // ── Read ────────────────────────────────────────────────────────────────

  /**
   * Get a configuration value by key.
   *
   * Checks runtime overrides first, then falls back to the driver.
   * Supports dot-notation for nested values (e.g., `'database.host'`).
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key (supports dot notation)
   * @param defaultValue - Fallback value if key is not found
   * @returns The configuration value, or `defaultValue` if not found
   *
   * @example
   * ```typescript
   * const host = config.get('database.host', 'localhost');
   * const port = config.get<number>('database.port', 5432);
   * ```
   */
  public get<T = any>(key: string, defaultValue?: T): T | undefined {
    // Runtime overrides take precedence
    if (this._overrides.has(key)) {
      return this._overrides.get(key) as T;
    }
    return this._driver.get<T>(key, defaultValue);
  }

  /**
   * Get a configuration value or throw if not found.
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key
   * @returns The configuration value
   * @throws Error if the key is not set
   *
   * @example
   * ```typescript
   * const secret = config.getOrThrow<string>('JWT_SECRET');
   * ```
   */
  public getOrThrow<T = any>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined) {
      throw new Error(`Configuration key "${key}" is required but not set`);
    }
    return value;
  }

  // ── Typed getters ───────────────────────────────────────────────────────

  /**
   * Get a string configuration value.
   *
   * @param key - Configuration key
   * @param defaultValue - Fallback string value
   * @returns The string value, or `defaultValue` if not found
   */
  public getString(key: string, defaultValue?: string): string | undefined {
    const value = this.get(key, defaultValue);
    return value !== undefined ? String(value) : undefined;
  }

  /**
   * Get a string configuration value or throw if not found.
   *
   * @param key - Configuration key
   * @returns The string value
   * @throws Error if the key is not set
   */
  public getStringOrThrow(key: string): string {
    return String(this.getOrThrow(key));
  }

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
  public getNumber(key: string, defaultValue?: number): number | undefined {
    const value = this.get(key, defaultValue);
    if (value === undefined) {
      return undefined;
    }
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get a numeric configuration value or throw if not found.
   *
   * @param key - Configuration key
   * @returns The numeric value
   * @throws Error if the key is not set
   */
  public getNumberOrThrow(key: string): number {
    const value = this.getNumber(key);
    if (value === undefined) {
      throw new Error(`Configuration key "${key}" is required but not set`);
    }
    return value;
  }

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
  public getBool(key: string, defaultValue?: boolean): boolean | undefined {
    const value = this.get(key, defaultValue);
    if (value === undefined) {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return ['true', '1', 'yes', 'on'].includes(Str.lower(String(value)));
  }

  /**
   * Get a boolean configuration value or throw if not found.
   *
   * @param key - Configuration key
   * @returns The boolean value
   * @throws Error if the key is not set
   */
  public getBoolOrThrow(key: string): boolean {
    const value = this.getBool(key);
    if (value === undefined) {
      throw new Error(`Configuration key "${key}" is required but not set`);
    }
    return value;
  }

  /**
   * Get an array configuration value.
   *
   * Splits comma-separated strings into arrays. If the value is
   * already an array, it's returned as-is (stringified).
   *
   * @param key - Configuration key
   * @param defaultValue - Fallback array value
   * @returns The array value, or `defaultValue` if not found
   *
   * @example
   * ```typescript
   * // ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   * const origins = config.getArray('ALLOWED_ORIGINS');
   * // => ['http://localhost:3000', 'http://localhost:5173']
   * ```
   */
  public getArray(key: string, defaultValue?: string[]): string[] | undefined {
    const value = this.get(key, defaultValue);
    if (value === undefined) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.map(String);
    }
    return String(value)
      .split(',')
      .map((v) => Str.trim(v))
      .filter(Boolean);
  }

  /**
   * Get a JSON configuration value.
   *
   * Parses JSON strings into objects. If the value is already
   * an object, it's returned as-is.
   *
   * @typeParam T - Expected return type
   * @param key - Configuration key
   * @param defaultValue - Fallback value
   * @returns The parsed JSON value, or `defaultValue` if parsing fails
   */
  public getJson<T = any>(key: string, defaultValue?: T): T | undefined {
    const value = this.get(key, defaultValue);
    if (value === undefined) {
      return undefined;
    }
    if (typeof value === 'object') {
      return value as T;
    }
    try {
      return JSON.parse(String(value)) as T;
    } catch {
      return defaultValue;
    }
  }

  // ── Introspection ───────────────────────────────────────────────────────

  /**
   * Check if a configuration key exists.
   *
   * Checks both runtime overrides and the underlying driver.
   *
   * @param key - Configuration key (supports dot notation)
   * @returns `true` if the key exists in overrides or the configuration
   */
  public has(key: string): boolean {
    return this._overrides.has(key) || this._driver.has(key);
  }

  /**
   * Get all configuration values as a plain object.
   *
   * Merges driver values with runtime overrides. Overrides take precedence.
   *
   * @returns A shallow copy of all configuration key-value pairs
   */
  public all(): Record<string, any> {
    const base = this._driver.all();
    // Apply overrides on top
    for (const [key, value] of this._overrides) {
      base[key] = value;
    }
    return base;
  }

  // ── Mutation ────────────────────────────────────────────────────────────

  /**
   * Set a configuration value at runtime.
   *
   * Creates a runtime override that takes precedence over the driver's
   * value. Useful for feature flags, A/B tests, or test fixtures.
   *
   * @param key - Configuration key
   * @param value - The value to set
   * @returns `this` for chaining
   *
   * @example
   * ```typescript
   * config.set('FEATURE_NEW_UI', true);
   * config.set('API_TIMEOUT', 5000);
   * ```
   */
  public set(key: string, value: any): this {
    this._overrides.set(key, value);
    return this;
  }

  /**
   * Remove a runtime override, reverting to the driver's value.
   *
   * @param key - Configuration key to unset
   * @returns `this` for chaining
   */
  public unset(key: string): this {
    this._overrides.delete(key);
    return this;
  }

  // ── Secrets ─────────────────────────────────────────────────────────────

  /**
   * Mark one or more keys as sensitive.
   *
   * Sensitive keys are redacted in `toSafeObject()` output, preventing
   * accidental exposure in logs, error reports, or debug dumps.
   *
   * @param keys - Key(s) to mark as sensitive
   * @returns `this` for chaining
   *
   * @example
   * ```typescript
   * config.markSensitive('JWT_SECRET', 'DB_PASSWORD', 'API_KEY');
   * config.toSafeObject(); // { JWT_SECRET: '[REDACTED]', ... }
   * ```
   */
  public markSensitive(...keys: string[]): this {
    for (const key of keys) {
      this._sensitiveKeys.add(key);
    }
    return this;
  }

  /**
   * Get all configuration values with sensitive keys redacted.
   *
   * Returns a copy of `all()` where keys marked as sensitive
   * have their values replaced with `'[REDACTED]'`. Safe for
   * logging, error reports, and debug output.
   *
   * @param redactValue - Custom redaction placeholder
   *   (default: `'[REDACTED]'`)
   * @returns A redacted copy of all configuration key-value pairs
   *
   * @example
   * ```typescript
   * config.markSensitive('JWT_SECRET');
   * config.toSafeObject();
   * // { APP_NAME: 'MyApp', JWT_SECRET: '[REDACTED]' }
   * ```
   */
  public toSafeObject(redactValue: string = '[REDACTED]'): Record<string, any> {
    const all = this.all();
    for (const key of this._sensitiveKeys) {
      if (key in all) {
        all[key] = redactValue;
      }
    }
    return all;
  }

  /**
   * Clear all runtime overrides.
   *
   * Reverts all values to the driver's original configuration.
   */
  public clearCache(): void {
    this._overrides.clear();
  }
}
