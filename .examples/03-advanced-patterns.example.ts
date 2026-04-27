/**
 * @fileoverview Advanced Config Patterns
 *
 * Demonstrates advanced usage including runtime overrides, secrets masking,
 * Vite plugin setup, custom drivers, validation, and the ConfigManager API.
 *
 * @module examples/advanced-patterns
 *
 * Prerequisites:
 * - @stackra/ts-config installed and ConfigModule.forRoot() configured
 * - @stackra/ts-container installed
 */

// ============================================================================
// 1. Runtime Overrides — Feature Flags & A/B Tests
// ============================================================================

import {
  ConfigManager,
  CONFIG_MANAGER,
  CONFIG_SERVICE,
  type ConfigService,
} from '@stackra/ts-config';
import { Injectable, Inject } from '@stackra/ts-container';

/**
 * Runtime overrides let you change config values without restarting.
 *
 * Overrides take precedence over the driver's values. Useful for:
 * - Feature flags toggled via admin panel
 * - A/B test assignments
 * - Test fixtures
 */
@Injectable()
class FeatureFlagManager {
  constructor(@Inject(CONFIG_SERVICE) private config: ConfigService) {}

  /**
   * Enable a feature flag at runtime.
   */
  enable(flag: string): void {
    this.config.set(`FEATURE_${flag.toUpperCase()}`, true);
  }

  /**
   * Disable a feature flag at runtime.
   */
  disable(flag: string): void {
    this.config.set(`FEATURE_${flag.toUpperCase()}`, false);
  }

  /**
   * Reset a flag to its original value from the driver.
   */
  reset(flag: string): void {
    this.config.unset(`FEATURE_${flag.toUpperCase()}`);
  }

  /**
   * Check if a feature is enabled.
   */
  isEnabled(flag: string): boolean {
    return this.config.getBool(`FEATURE_${flag.toUpperCase()}`, false) ?? false;
  }

  /**
   * Apply multiple overrides at once (e.g., from an API response).
   */
  applyOverrides(overrides: Record<string, any>): void {
    for (const [key, value] of Object.entries(overrides)) {
      this.config.set(key, value);
    }
  }

  /**
   * Clear all runtime overrides.
   */
  clearAll(): void {
    this.config.clearCache();
  }
}

// ============================================================================
// 2. Secrets Masking — Safe Logging & Debug Output
// ============================================================================

/**
 * Mark sensitive keys to prevent accidental exposure in logs,
 * error reports, or debug dumps.
 *
 * `toSafeObject()` returns a copy with sensitive values replaced
 * by `'[REDACTED]'`.
 */
@Injectable()
class DiagnosticsService {
  constructor(@Inject(CONFIG_SERVICE) private config: ConfigService) {
    // Mark keys as sensitive at construction time
    this.config.markSensitive(
      'JWT_SECRET',
      'DB_PASSWORD',
      'STRIPE_KEY',
      'API_SECRET',
      'ENCRYPTION_KEY'
    );
  }

  /**
   * Get a safe config dump for error reports.
   */
  getSafeConfigDump(): Record<string, any> {
    return this.config.toSafeObject();
    // { APP_NAME: 'MyApp', JWT_SECRET: '[REDACTED]', DB_HOST: 'localhost', ... }
  }

  /**
   * Get a safe dump with a custom redaction placeholder.
   */
  getSafeConfigForLogs(): Record<string, any> {
    return this.config.toSafeObject('***');
    // { APP_NAME: 'MyApp', JWT_SECRET: '***', DB_HOST: 'localhost', ... }
  }

  /**
   * Log config safely — no secrets leak.
   */
  logConfig(): void {
    console.log('Current configuration:', this.config.toSafeObject());
  }
}

// ============================================================================
// 3. Vite Plugin Setup — Virtual Module + HMR
// ============================================================================

/**
 * The Vite plugin serves config via a virtual module with HMR support.
 *
 * In `vite.config.ts`:
 */

// import { defineConfig, loadEnv } from 'vite';
// import { viteConfigPlugin } from '@stackra/ts-config/vite-plugin';
//
// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, 'environments', '');
//
//   return {
//     plugins: [
//       viteConfigPlugin({
//         env,
//         scanConfigFiles: true,
//         configFilePattern: ['config/**/*.config.ts', 'src/**/*.config.ts'],
//         globalName: '__APP_CONFIG__',
//         enableHMR: true,
//         debug: true,
//       }),
//     ],
//   };
// });

/**
 * Consumers import from the virtual module:
 *
 * ```typescript
 * import { config, get, has } from 'virtual:@stackra/ts-config';
 *
 * const appName = get('APP_NAME', 'MyApp');
 * const hasDebug = has('DEBUG');
 * console.log(config); // Full config object
 * ```
 *
 * For TypeScript support, add to `tsconfig.json`:
 * ```json
 * {
 *   "compilerOptions": {
 *     "types": ["@stackra/ts-config/client"]
 *   }
 * }
 * ```
 *
 * Or add a triple-slash directive:
 * ```typescript
 * /// <reference types="@stackra/ts-config/client" />
 * ```
 */

// ============================================================================
// 4. Config Validation
// ============================================================================

import { Module } from '@stackra/ts-container';
import { ConfigModule } from '@/index';

/**
 * Validate configuration on module initialization.
 *
 * The `validate` function runs after the default source is loaded.
 * Throw an error to reject invalid configuration and prevent
 * the application from starting with bad config.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      default: 'env',
      sources: {
        env: { driver: 'env', envPrefix: 'auto' },
      },
      validate: (config) => {
        const required = ['APP_NAME', 'DB_HOST', 'JWT_SECRET'];
        const missing = required.filter((key) => !(key in config));

        if (missing.length > 0) {
          throw new Error(`Missing required configuration keys: ${missing.join(', ')}`);
        }

        // Type validation
        const port = Number(config.PORT);
        if (config.PORT && isNaN(port)) {
          throw new Error(`PORT must be a number, got: "${config.PORT}"`);
        }

        if (port < 1 || port > 65535) {
          throw new Error(`PORT must be between 1 and 65535, got: ${port}`);
        }
      },
    }),
  ],
})
export class ValidatedConfigModule {}

// ============================================================================
// 5. Custom Driver via extend()
// ============================================================================

/**
 * Register a custom config driver using the manager's `extend()` method.
 *
 * The driver creator receives the raw source config and returns
 * a `ConfigDriver` instance.
 */
import type { ConfigDriver } from '@/index';
import { getNestedValue, hasNestedValue } from '@/index';

/**
 * Custom driver that reads from localStorage.
 * Useful for persisting user preferences in the browser.
 */
class LocalStorageDriver implements ConfigDriver {
  private config: Record<string, any> = {};
  private loaded = false;

  constructor(private readonly prefix: string = 'config_') {}

  load(): Record<string, any> {
    if (this.loaded) return this.config;

    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          const configKey = key.substring(this.prefix.length);
          try {
            this.config[configKey] = JSON.parse(localStorage.getItem(key)!);
          } catch {
            this.config[configKey] = localStorage.getItem(key);
          }
        }
      }
    }

    this.loaded = true;
    return this.config;
  }

  get<T = any>(key: string, defaultValue?: T): T | undefined {
    if (!this.loaded) this.load();
    return getNestedValue(this.config, key, defaultValue);
  }

  has(key: string): boolean {
    if (!this.loaded) this.load();
    return hasNestedValue(this.config, key);
  }

  all(): Record<string, any> {
    if (!this.loaded) this.load();
    return { ...this.config };
  }
}

/**
 * Register the custom driver with ConfigManager.
 */
@Injectable()
class CustomDriverSetup {
  constructor(@Inject(CONFIG_MANAGER) private manager: ConfigManager) {
    // Register the custom driver
    this.manager.extend('localStorage', (config) => {
      return new LocalStorageDriver(config.prefix ?? 'config_');
    });
  }

  /**
   * Access the custom driver's config.
   */
  getUserPreferences(): ConfigService {
    return this.manager.source('localStorage');
  }
}

// ============================================================================
// 6. ConfigManager Introspection API
// ============================================================================

/**
 * The ConfigManager provides introspection methods for
 * inspecting and managing the config system at runtime.
 */
@Injectable()
class ConfigIntrospectionService {
  constructor(@Inject(CONFIG_MANAGER) private manager: ConfigManager) {}

  /**
   * List all configured source names.
   */
  getSources(): string[] {
    return this.manager.getSourceNames();
    // ['env', 'api', 'firebase']
  }

  /**
   * Check if a source exists.
   */
  hasSource(name: string): boolean {
    return this.manager.hasSource(name);
  }

  /**
   * Get the default source name.
   */
  getDefault(): string {
    return this.manager.getDefaultSource();
  }

  /**
   * Switch the default source at runtime.
   */
  switchDefault(name: string): void {
    this.manager.setDefaultInstance(name);
  }

  /**
   * Force re-creation of a source (e.g., after remote config changes).
   */
  refreshSource(name: string): void {
    this.manager.forgetSource(name);
  }

  /**
   * Clear all cached sources.
   */
  refreshAll(): void {
    this.manager.purge();
  }
}

// ============================================================================
// 7. File Driver — Scanning Config Files
// ============================================================================

/**
 * The file driver scans the filesystem for `.config.ts` files
 * and merges their exports into a single config object.
 *
 * Supports:
 * - `.json` files (parsed via JSON.parse)
 * - `.ts` / `.js` files (loaded via dynamic import)
 * - Factory functions (called if the export is a function)
 * - Glob patterns for flexible file discovery
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      default: 'file',
      sources: {
        file: {
          driver: 'file',
          filePattern: ['config/**/*.config.ts', 'src/**/*.config.ts', 'config/**/*.config.json'],
          fileRoot: process.cwd(),
          fileExcludeDirs: ['node_modules', 'dist', 'build', '.git', 'coverage'],
        },
      },
    }),
  ],
})
export class FileDriverModule {}

/**
 * Example config file: `config/database.config.ts`
 *
 * ```typescript
 * export default {
 *   database: {
 *     host: 'localhost',
 *     port: 5432,
 *     name: 'myapp',
 *     pool: { min: 2, max: 10 },
 *   },
 * };
 * ```
 *
 * Access via dot notation:
 * ```typescript
 * const host = config.getString('database.host'); // 'localhost'
 * const poolMax = config.getNumber('database.pool.max'); // 10
 * ```
 */

// ============================================================================
// 8. Pre-loaded Config (Browser / SSR)
// ============================================================================

/**
 * For browser environments or SSR, pass a pre-loaded config object
 * directly to the file driver. This skips filesystem scanning.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      default: 'static',
      sources: {
        static: {
          driver: 'file',
          config: {
            APP_NAME: 'MyApp',
            API_URL: 'https://api.example.com',
            FEATURES: {
              newUI: true,
              betaAPI: false,
            },
          },
        },
      },
    }),
  ],
})
export class PreloadedConfigModule {}

// ============================================================================
// Exports (for reference)
// ============================================================================

export {
  FeatureFlagManager,
  DiagnosticsService,
  LocalStorageDriver,
  CustomDriverSetup,
  ConfigIntrospectionService,
};
