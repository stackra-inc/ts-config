/**
 * Load Config File Utility
 *
 * Dynamically imports and parses a single configuration file at runtime.
 * Supports default exports, named exports, and factory functions.
 *
 * @module utils/load-config-file
 */

/**
 * Dynamically load and parse a configuration file.
 *
 * Uses `import()` to load the file, then resolves the config value:
 * 1. Prefers `module.default` over the raw module object
 * 2. If the resolved value is a function, calls it (supports async factories)
 * 3. Returns the resulting plain object
 *
 * On failure, logs a warning and returns an empty object so that
 * one broken config file doesn't crash the entire loading pipeline.
 *
 * @param filePath - Absolute path to the configuration file
 * @returns The parsed configuration object, or `{}` on failure
 *
 * @example
 * ```typescript
 * const dbConfig = await loadConfigFile('/app/config/database.config.ts');
 * // { host: 'localhost', port: 5432 }
 * ```
 */
export async function loadConfigFile(filePath: string): Promise<Record<string, any>> {
  try {
    // Dynamic import of the config file
    // @ts-ignore - Dynamic import path
    const module = await import(/* @vite-ignore */ filePath);

    // Extract config object (could be default export or named export)
    const config = module.default || module;

    // If it's a function, call it
    if (typeof config === 'function') {
      return await config();
    }

    return config;
  } catch (error) {
    console.warn(`[vite-plugin-config] Failed to load config file: ${filePath}`, error);
    return {};
  }
}
