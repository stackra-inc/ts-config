/**
 * Type declarations for the Vite virtual module.
 *
 * Consumers should reference this file in their `tsconfig.json`:
 * ```json
 * {
 *   "compilerOptions": {
 *     "types": ["@stackra/ts-config/client"]
 *   }
 * }
 * ```
 *
 * Or add a triple-slash directive in a `.d.ts` file:
 * ```typescript
 * /// <reference types="@stackra/ts-config/client" />
 * ```
 */

declare module 'virtual:@stackra/ts-config' {
  /**
   * The full configuration object.
   * Contains merged environment variables and scanned config file values.
   */
  export const config: Record<string, any>;

  /**
   * Get a configuration value by key.
   *
   * @param key - Configuration key (supports dot notation)
   * @param defaultValue - Fallback value if key is not found
   * @returns The configuration value, or `defaultValue`
   */
  export function get<T = any>(key: string, defaultValue?: T): T | undefined;

  /**
   * Check if a configuration key exists.
   *
   * @param key - Configuration key (supports dot notation)
   * @returns `true` if the key exists
   */
  export function has(key: string): boolean;
}
