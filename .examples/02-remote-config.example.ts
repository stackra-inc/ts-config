/**
 * @fileoverview Remote Configuration — HTTP, AWS AppConfig, Firebase
 *
 * Demonstrates how to fetch configuration from remote sources using
 * the HTTP driver with `@stackra/ts-http`'s HttpClient.
 *
 * @module examples/remote-config
 *
 * Prerequisites:
 * - @stackra/ts-config installed
 * - @stackra/ts-http installed (for HTTP driver)
 * - @stackra/ts-container installed
 * - HttpModule.forRoot() imported before ConfigModule.forRoot()
 */

import {
  ConfigModule,
  ConfigManager,
  CONFIG_MANAGER,
  CONFIG_SERVICE,
  type ConfigService,
} from '@stackra/ts-config';
import { HttpModule } from '@stackra/ts-http';
import { Module, Injectable, Inject } from '@stackra/ts-container';

// ============================================================================
// 1. Simple REST API Config Endpoint
// ============================================================================

/**
 * Fetch configuration from a REST API.
 *
 * The HTTP driver uses the injected HttpClient, so it inherits
 * all middleware (auth, retry, logging) configured on HttpModule.
 */
@Module({
  imports: [
    HttpModule.forRoot({
      baseURL: 'https://api.example.com/v1',
      timeout: 10000,
    }),
    ConfigModule.forRoot({
      default: 'env',
      sources: {
        env: {
          driver: 'env',
          envPrefix: 'auto',
        },
        api: {
          driver: 'http',
          http: {
            url: '/config',
            retries: 3,
            retryDelay: 2000,
          },
        },
      },
    }),
  ],
})
export class RestApiConfigModule {}

// ============================================================================
// 2. AWS AppConfig (via HTTP Data Plane)
// ============================================================================

/**
 * Fetch configuration from AWS AppConfig.
 *
 * AWS AppConfig exposes a local HTTP endpoint when using the
 * AppConfig Agent (Lambda extension or ECS sidecar). The agent
 * handles caching, polling, and feature flag evaluation.
 *
 * @see https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions.html
 */
@Module({
  imports: [
    HttpModule.forRoot({
      baseURL: 'http://localhost:2772',
      timeout: 5000,
    }),
    ConfigModule.forRoot({
      default: 'env',
      sources: {
        env: {
          driver: 'env',
          envPrefix: 'auto',
        },
        appconfig: {
          driver: 'http',
          http: {
            url: '/applications/MyApp/environments/production/configurations/MainConfig',
            retries: 2,
            retryDelay: 1000,
          },
        },
      },
    }),
  ],
})
export class AwsAppConfigModule {}

/**
 * Service that reads from AWS AppConfig.
 */
@Injectable()
class AwsConfigService {
  constructor(@Inject(CONFIG_MANAGER) private manager: ConfigManager) {}

  /**
   * Get a feature flag from AppConfig.
   */
  async getFeatureFlag(flag: string): Promise<boolean> {
    const config = await this.manager.sourceAsync('appconfig');
    return config.getBool(flag, false) ?? false;
  }

  /**
   * Get a config value with env fallback.
   */
  async getValue(key: string, fallback?: string): Promise<string | undefined> {
    try {
      const remote = await this.manager.sourceAsync('appconfig');
      const value = remote.getString(key);
      if (value !== undefined) return value;
    } catch {
      // AppConfig unavailable — fall back to env
    }

    return this.manager.source('env').getString(key, fallback);
  }
}

// ============================================================================
// 3. Firebase Remote Config
// ============================================================================

/**
 * Fetch configuration from Firebase Remote Config REST API.
 *
 * Firebase wraps values in a nested structure:
 * ```json
 * {
 *   "parameters": {
 *     "FEATURE_NEW_UI": { "defaultValue": { "value": "true" } },
 *     "API_TIMEOUT": { "defaultValue": { "value": "5000" } }
 *   }
 * }
 * ```
 *
 * The `transform` function normalizes this into a flat config object.
 */
@Module({
  imports: [
    HttpModule.forRoot({
      baseURL: 'https://firebaseremoteconfig.googleapis.com',
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${process.env.FIREBASE_TOKEN}`,
      },
    }),
    ConfigModule.forRoot({
      default: 'env',
      sources: {
        env: {
          driver: 'env',
          envPrefix: 'auto',
        },
        firebase: {
          driver: 'http',
          http: {
            url: '/v1/projects/my-project-id/remoteConfig',
            retries: 2,
            retryDelay: 1500,
            transform: (data: any) => {
              // Normalize Firebase's nested parameter structure
              const params: Record<string, any> = {};
              for (const [key, value] of Object.entries(data.parameters || {})) {
                const defaultValue = (value as any)?.defaultValue?.value;
                if (defaultValue !== undefined) {
                  params[key] = defaultValue;
                }
              }
              return params;
            },
          },
        },
      },
    }),
  ],
})
export class FirebaseRemoteConfigModule {}

// ============================================================================
// 4. Multi-Source Fallback Pattern
// ============================================================================

/**
 * Service that implements a fallback chain across multiple sources.
 *
 * Priority: API → Firebase → Env → Default
 *
 * This pattern is common in enterprise apps where remote config
 * takes precedence but env vars serve as a safety net.
 */
@Injectable()
class ResilientConfigService {
  constructor(@Inject(CONFIG_MANAGER) private manager: ConfigManager) {}

  /**
   * Get a config value with multi-source fallback.
   *
   * Tries each source in priority order. If a source fails
   * (network error, timeout), falls through to the next one.
   */
  async get(key: string, defaultValue?: string): Promise<string | undefined> {
    // 1. Try API source
    try {
      const api = await this.manager.sourceAsync('api');
      const value = api.getString(key);
      if (value !== undefined) return value;
    } catch {
      // API unavailable — continue
    }

    // 2. Try Firebase source
    try {
      const firebase = await this.manager.sourceAsync('firebase');
      const value = firebase.getString(key);
      if (value !== undefined) return value;
    } catch {
      // Firebase unavailable — continue
    }

    // 3. Fall back to env (always available, sync)
    return this.manager.source('env').getString(key, defaultValue);
  }

  /**
   * Get a boolean feature flag with fallback.
   */
  async isFeatureEnabled(flag: string): Promise<boolean> {
    const value = await this.get(flag, 'false');
    return ['true', '1', 'yes', 'on'].includes((value ?? '').toLowerCase());
  }
}

// ============================================================================
// 5. Custom Response Transform
// ============================================================================

/**
 * Example of a custom transform for a non-standard API response.
 *
 * Suppose your config API returns:
 * ```json
 * {
 *   "status": "ok",
 *   "data": {
 *     "settings": { "theme": "dark", "locale": "en" },
 *     "features": { "new_ui": true, "beta_api": false }
 *   }
 * }
 * ```
 *
 * The transform flattens it into a single-level config object.
 */
@Module({
  imports: [
    HttpModule.forRoot({ baseURL: 'https://api.example.com' }),
    ConfigModule.forRoot({
      default: 'api',
      sources: {
        api: {
          driver: 'http',
          http: {
            url: '/v2/config',
            transform: (response: any) => {
              const { settings = {}, features = {} } = response.data || {};
              // Flatten: prefix feature flags with FEATURE_
              const featureFlags: Record<string, any> = {};
              for (const [key, value] of Object.entries(features)) {
                featureFlags[`FEATURE_${key.toUpperCase()}`] = value;
              }
              return { ...settings, ...featureFlags };
            },
          },
        },
      },
    }),
  ],
})
export class CustomTransformModule {}

// ============================================================================
// 6. Merging Remote Config with Static Overrides
// ============================================================================

/**
 * Use the `load` option to merge static values on top of
 * the driver's loaded configuration.
 *
 * This is useful for providing local overrides or defaults
 * that the remote source might not include.
 */
@Module({
  imports: [
    HttpModule.forRoot({ baseURL: 'https://api.example.com' }),
    ConfigModule.forRoot({
      default: 'api',
      sources: {
        api: {
          driver: 'http',
          http: { url: '/config' },
          // Static overrides merged on top of the API response
          load: {
            APP_VERSION: '2.1.0',
            BUILD_NUMBER: '1234',
            LOCAL_OVERRIDE: 'this-takes-precedence',
          },
        },
      },
    }),
  ],
})
export class MergedConfigModule {}

// ============================================================================
// Exports (for reference)
// ============================================================================

export { AwsConfigService, ResilientConfigService };
