/**
 * Nested Value Utilities
 *
 * Provides dot-notation access and existence checks for deeply nested
 * object properties. Used by all drivers and the `ConfigService` to
 * resolve keys like `'database.host'`.
 *
 * @module utils/get-nested-value
 */

/**
 * Get a nested value from an object using dot notation.
 *
 * Splits the path on `'.'` and walks the object tree. Returns
 * `defaultValue` if any segment along the path is `null` or `undefined`.
 *
 * @typeParam T - Expected return type
 * @param obj - Source object to traverse
 * @param path - Dot-notated path (e.g., `'database.host'`)
 * @param defaultValue - Fallback value if the path is not found
 * @returns The value at the given path, or `defaultValue`
 *
 * @example
 * ```typescript
 * const config = { database: { host: 'localhost', port: 5432 } };
 * getNestedValue(config, 'database.host');       // 'localhost'
 * getNestedValue(config, 'database.port');        // 5432
 * getNestedValue(config, 'database.name', 'app'); // 'app'
 * ```
 */
export function getNestedValue<T = any>(
  obj: Record<string, any>,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Check if a nested path exists in an object.
 *
 * Walks the object tree using dot-notation. Returns `false` if any
 * segment is `null`, `undefined`, or the key is not present via `in`.
 *
 * @param obj - Source object to traverse
 * @param path - Dot-notated path (e.g., `'database.host'`)
 * @returns `true` if every segment of the path exists
 *
 * @example
 * ```typescript
 * const config = { database: { host: 'localhost' } };
 * hasNestedValue(config, 'database.host');  // true
 * hasNestedValue(config, 'database.port');  // false
 * hasNestedValue(config, 'cache.driver');   // false
 * ```
 */
export function hasNestedValue(obj: Record<string, any>, path: string): boolean {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return false;
    }
    current = current[key];
  }

  return true;
}
