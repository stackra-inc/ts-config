/**
 * @fileoverview Config Module Setup & Basic Operations
 *
 * Demonstrates how to configure the ConfigModule with different sources
 * and perform basic configuration access (get, getString, getNumber, etc.).
 *
 * @module examples/module-setup
 *
 * Prerequisites:
 * - @stackra/ts-config installed
 * - @stackra/ts-container installed
 * - @stackra/ts-support installed
 */

// ============================================================================
// 1. Basic Module Setup — Env Source Only
// ============================================================================

import {
  ConfigModule,
  ConfigManager,
  CONFIG_SERVICE,
  CONFIG_MANAGER,
  defineConfig,
  type ConfigService,
} from '@stackra/ts-config';
import { Module, Injectable, Inject } from '@stackra/ts-container';

/**
 * Minimal setup with a single env source.
 *
 * The env driver reads from `process.env` (Node.js) or
 * `window.__APP_CONFIG__` (browser, injected by Vite plugin).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      default: 'env',
      sources: {
        env: {
          driver: 'env',
          envPrefix: 'auto',
        },
      },
    }),
  ],
})
export class BasicAppModule {}

// ============================================================================
// 2. Multi-Source Setup — Env + File + HTTP
// ============================================================================

/**
 * Full configuration with multiple sources.
 *
 * - `env` — reads from process.env / window global
 * - `file` — scans and loads .config.ts files from disk
 * - `api` — fetches config from a remote HTTP endpoint
 *
 * Requires `HttpModule.forRoot()` to be imported before ConfigModule
 * when using the `http` driver.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      default: 'env',
      debug: true,
      sources: {
        env: {
          driver: 'env',
          envPrefix: 'VITE_',
        },
        file: {
          driver: 'file',
          filePattern: ['config/**/*.config.ts', 'src/**/*.config.ts'],
          fileRoot: process.cwd(),
        },
        api: {
          driver: 'http',
          http: {
            url: '/api/config',
            retries: 2,
            retryDelay: 1000,
          },
        },
      },
    }),
  ],
})
export class MultiSourceAppModule {}

// ============================================================================
// 3. Using defineConfig for Type-Safe Configuration
// ============================================================================

/**
 * The `defineConfig` helper provides IDE autocomplete and type checking.
 * Follows the same pattern as Vite, Vitest, etc.
 *
 * Typically placed in `config/config.config.ts`.
 */
const configConfig = defineConfig({
  default: 'env',
  sensitiveKeys: ['JWT_SECRET', 'DB_PASSWORD', 'STRIPE_KEY'],
  sources: {
    env: {
      driver: 'env',
      envPrefix: 'auto',
      expandVariables: true,
    },
  },
});

@Module({
  imports: [ConfigModule.forRoot(configConfig)],
})
export class ConfigDrivenAppModule {}

// ============================================================================
// 4. Basic Config Access via CONFIG_SERVICE
// ============================================================================

/**
 * Inject `CONFIG_SERVICE` to get the default source's ConfigService.
 * This is the most common injection pattern for consumers.
 */
@Injectable()
class DatabaseService {
  constructor(@Inject(CONFIG_SERVICE) private config: ConfigService) {}

  connect() {
    const host = this.config.getString('DB_HOST', 'localhost');
    const port = this.config.getNumber('DB_PORT', 5432);
    const ssl = this.config.getBool('DB_SSL', false);
    const name = this.config.getStringOrThrow('DB_NAME');

    console.log(`Connecting to ${host}:${port}/${name} (SSL: ${ssl})`);
  }
}

// ============================================================================
// 5. Typed Getters — All Variants
// ============================================================================

/**
 * Demonstrates all typed getter methods available on ConfigService.
 */
@Injectable()
class AppConfigService {
  constructor(@Inject(CONFIG_SERVICE) private config: ConfigService) {}

  demonstrate() {
    // ── String ────────────────────────────────────────────────────────
    const appName = this.config.getString('APP_NAME', 'MyApp');
    const secret = this.config.getStringOrThrow('JWT_SECRET');

    // ── Number ────────────────────────────────────────────────────────
    const port = this.config.getNumber('PORT', 3000);
    const maxRetries = this.config.getNumberOrThrow('MAX_RETRIES');

    // ── Boolean ───────────────────────────────────────────────────────
    // Treats 'true', '1', 'yes', 'on' as true
    const debug = this.config.getBool('DEBUG', false);
    const maintenance = this.config.getBoolOrThrow('MAINTENANCE_MODE');

    // ── Array ─────────────────────────────────────────────────────────
    // Splits comma-separated strings: "a,b,c" → ['a', 'b', 'c']
    const origins = this.config.getArray('ALLOWED_ORIGINS', ['http://localhost']);

    // ── JSON ──────────────────────────────────────────────────────────
    // Parses JSON strings: '{"host":"localhost"}' → { host: 'localhost' }
    const dbConfig = this.config.getJson<{ host: string; port: number }>('DB_CONFIG', {
      host: 'localhost',
      port: 5432,
    });

    // ── Generic ───────────────────────────────────────────────────────
    const value = this.config.get<string>('CUSTOM_KEY');
    const required = this.config.getOrThrow<string>('REQUIRED_KEY');

    // ── Existence check ───────────────────────────────────────────────
    if (this.config.has('FEATURE_FLAG_NEW_UI')) {
      console.log('New UI feature flag is set');
    }

    // ── All values ────────────────────────────────────────────────────
    const all = this.config.all();
    console.log('Total config keys:', Object.keys(all).length);
  }
}

// ============================================================================
// 6. Switching Sources at Runtime via ConfigManager
// ============================================================================

/**
 * Inject `CONFIG_MANAGER` to access multiple named sources.
 */
@Injectable()
class FeatureFlagService {
  constructor(@Inject(CONFIG_MANAGER) private manager: ConfigManager) {}

  /**
   * Get a feature flag from the API source (async).
   */
  async isEnabled(flag: string): Promise<boolean> {
    const apiConfig = await this.manager.sourceAsync('api');
    return apiConfig.getBool(flag, false) ?? false;
  }

  /**
   * Get a config value from the env source (sync).
   */
  getEnvValue(key: string, fallback?: string): string | undefined {
    const envConfig = this.manager.source('env');
    return envConfig.getString(key, fallback);
  }

  /**
   * Introspect available sources.
   */
  listSources(): string[] {
    return this.manager.getSourceNames();
  }
}

// ============================================================================
// Exports (for reference)
// ============================================================================

export { DatabaseService, AppConfigService, FeatureFlagService };
