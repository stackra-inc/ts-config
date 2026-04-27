/**
 * Configuration Manager
 *
 * The central orchestrator for the config system. Manages multiple named
 * config sources using the `MultipleInstanceManager` pattern.
 *
 * Each source is lazily created on first access, cached internally, and
 * reused on subsequent calls. The manager creates `ConfigDriver` instances
 * (EnvDriver, FileDriver, HttpDriver) and wraps them in `ConfigService`
 * instances that provide the high-level typed API.
 *
 * ## Architecture
 *
 * ```
 * ConfigManager (this class)
 *   ├── extends MultipleInstanceManager<ConfigDriver>
 *   ├── creates ConfigDriver instances (EnvDriver, FileDriver, HttpDriver)
 *   └── wraps them in ConfigService (the consumer-facing API)
 * ```
 *
 * ## Lifecycle
 *
 * - `OnModuleInit` — eagerly creates the default source
 * - `OnModuleDestroy` — clears all sources and releases resources
 *
 * @module services/config-manager
 */

import {
  Injectable,
  Inject,
  Optional,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@stackra/ts-container';
import { MultipleInstanceManager } from '@stackra/ts-support';

import { EnvDriver } from '@/drivers/env.driver';
import { FileDriver } from '@/drivers/file.driver';
import { HttpDriver } from '@/drivers/http.driver';
import { ConfigService } from './config.service';
import { CONFIG_OPTIONS } from '@/constants/tokens.constant';
import type { ConfigDriver } from '@/interfaces/config-driver.interface';
import type {
  ConfigModuleOptions,
  ConfigSourceOptions,
} from '@/interfaces/config-module-options.interface';

/**
 * Token for the optional HttpClient injection.
 * Resolved from `@stackra/ts-http` if available.
 */
const HTTP_CLIENT_TOKEN = Symbol.for('HTTP_CLIENT');

/**
 * ConfigManager — creates and manages multiple named config sources.
 *
 * @example
 * ```typescript
 * // Get default source service
 * const config = manager.source();
 * const host = config.getString('DB_HOST', 'localhost');
 *
 * // Get specific source service
 * const apiConfig = manager.source('api');
 * const apiUrl = apiConfig.getStringOrThrow('API_URL');
 *
 * // Register custom driver
 * manager.extend('custom', (config) => new MyDriver(config));
 * ```
 */
@Injectable()
export class ConfigManager
  extends MultipleInstanceManager<ConfigDriver>
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Cached ConfigService wrappers, keyed by source name.
   * Separate from the base class's ConfigDriver cache — this caches
   * the high-level ConfigService wrappers.
   */
  private readonly services: Map<string, ConfigService> = new Map();

  /**
   * @param config - Config module options (default source, sources map, debug)
   * @param httpClient - Optional HttpClient for HTTP-based sources.
   *   Injected automatically if HttpModule.forRoot() is imported.
   */
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly config: ConfigModuleOptions,
    @Optional() @Inject(HTTP_CLIENT_TOKEN) private readonly httpClient?: any
  ) {
    super();
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  /**
   * Called after all providers are instantiated.
   *
   * Eagerly creates the default source to catch config errors early.
   * Uses `sourceAsync` so that async drivers (file scanning, HTTP)
   * are handled correctly.
   */
  async onModuleInit(): Promise<void> {
    try {
      const service = await this.sourceAsync();

      // Run validation if configured
      if (this.config.validate) {
        await this.config.validate(service.all());
      }
    } catch (err) {
      console.warn(
        `[ConfigManager] Failed to create default source '${this.config.default}':`,
        (err as Error).message
      );
    }
  }

  /**
   * Called on `app.close()`.
   * Clears all sources and releases resources.
   */
  async onModuleDestroy(): Promise<void> {
    this.services.clear();
    this.purge();
  }

  // ── MultipleInstanceManager contract ────────────────────────────────────

  /**
   * Get the default source name from configuration.
   *
   * @returns The default source name (e.g., `'env'`, `'api'`)
   */
  getDefaultInstance(): string {
    return this.config.default;
  }

  /**
   * Change the default source at runtime.
   *
   * Subsequent calls to `source()` without a name argument will
   * resolve to the new default.
   *
   * @param name - The new default source name (must exist in config)
   */
  setDefaultInstance(name: string): void {
    (this.config as any).default = name;
  }

  /**
   * Get the raw configuration object for a named source.
   *
   * @param name - Source name to look up
   * @returns The source configuration, or `undefined` if not found
   */
  getInstanceConfig(name: string): Record<string, any> | undefined {
    return this.config.sources[name];
  }

  /**
   * Create a config driver instance synchronously.
   *
   * Dispatches to `EnvDriver` or `FileDriver` (with pre-loaded config).
   * For async drivers (file scanning, HTTP), use `createDriverAsync`.
   *
   * @param driver - Driver name (`'env'`, `'file'`)
   * @param config - Raw source configuration
   * @returns A new ConfigDriver instance
   * @throws Error if the driver is not supported synchronously
   */
  protected createDriver(driver: string, config: Record<string, any>): ConfigDriver {
    const sourceConfig = config as ConfigSourceOptions;
    const debug = this.config.debug;

    switch (driver) {
      case 'env': {
        const envDriver = new EnvDriver({
          expandVariables: sourceConfig.expandVariables,
          envPrefix: sourceConfig.envPrefix,
          globalName: sourceConfig.globalName,
          debug,
        });
        envDriver.load();

        // Merge custom load config if provided
        if (sourceConfig.load) {
          this.mergeCustomConfig(envDriver, sourceConfig.load);
        }

        return envDriver;
      }

      case 'file': {
        if (sourceConfig.config) {
          // Pre-loaded config — synchronous
          const fileDriver = new FileDriver({
            config: sourceConfig.config,
            debug,
          });
          return fileDriver;
        }
        // File scanning requires async — fall through to error
        throw new Error(
          'FileDriver with file scanning requires async initialization. ' +
            'The manager will use createDriverAsync automatically.'
        );
      }

      default:
        throw new Error(`Config driver [${driver}] is not supported synchronously.`);
    }
  }

  /**
   * Create a config driver instance asynchronously.
   *
   * Handles all driver types including async ones (file scanning, HTTP).
   *
   * @param driver - Driver name (`'env'`, `'file'`, `'http'`)
   * @param config - Raw source configuration
   * @returns A promise resolving to a ConfigDriver instance
   * @throws Error if the driver is not supported
   */
  protected async createDriverAsync(
    driver: string,
    config: Record<string, any>
  ): Promise<ConfigDriver> {
    const sourceConfig = config as ConfigSourceOptions;
    const debug = this.config.debug;

    switch (driver) {
      case 'env': {
        // Env is always sync — delegate to createDriver
        return this.createDriver(driver, config);
      }

      case 'file': {
        const fileDriver = new FileDriver({
          config: sourceConfig.config,
          filePattern: sourceConfig.filePattern,
          root: sourceConfig.fileRoot,
          excludeDirs: sourceConfig.fileExcludeDirs,
          debug,
        });
        await fileDriver.load();

        if (sourceConfig.load) {
          await this.mergeCustomConfigAsync(fileDriver, sourceConfig.load);
        }

        return fileDriver;
      }

      case 'http': {
        if (!sourceConfig.http) {
          throw new Error('HTTP source requires "http" options with at least a "url" property.');
        }

        if (!this.httpClient) {
          throw new Error(
            'HTTP config driver requires @stackra/ts-http.\n' +
              'Import HttpModule.forRoot() before ConfigModule.forRoot().'
          );
        }

        const httpDriver = new HttpDriver(this.httpClient, sourceConfig.http);
        await httpDriver.load();

        if (sourceConfig.load) {
          await this.mergeCustomConfigAsync(httpDriver, sourceConfig.load);
        }

        return httpDriver;
      }

      default:
        throw new Error(`Config driver [${driver}] is not supported.`);
    }
  }

  // ── Source access ───────────────────────────────────────────────────────

  /**
   * Get a ConfigService for a named source.
   *
   * The primary consumer API. Returns a ConfigService wrapping the
   * underlying driver with typed getters (getString, getNumber, etc.).
   * Cached — subsequent calls return the same instance.
   *
   * @param name - Source name. Uses default if omitted.
   * @returns A ConfigService wrapping the named source's driver
   *
   * @example
   * ```typescript
   * const config = manager.source();
   * const host = config.getString('DB_HOST', 'localhost');
   *
   * const apiConfig = manager.source('api');
   * ```
   */
  source(name?: string): ConfigService {
    const sourceName = name ?? this.config.default;

    const existing = this.services.get(sourceName);
    if (existing) return existing;

    const driverInstance = this.instance(sourceName);
    const service = new ConfigService(driverInstance, this.config.sensitiveKeys);

    this.services.set(sourceName, service);
    return service;
  }

  /**
   * Get a ConfigService for a named source (async).
   *
   * Use this for sources that require async initialization
   * (file scanning, HTTP fetching).
   *
   * @param name - Source name. Uses default if omitted.
   * @returns A promise resolving to a ConfigService
   *
   * @example
   * ```typescript
   * const apiConfig = await manager.sourceAsync('api');
   * const apiUrl = apiConfig.getStringOrThrow('API_URL');
   * ```
   */
  async sourceAsync(name?: string): Promise<ConfigService> {
    const sourceName = name ?? this.config.default;

    const existing = this.services.get(sourceName);
    if (existing) return existing;

    const driverInstance = await this.instanceAsync(sourceName);
    const service = new ConfigService(driverInstance, this.config.sensitiveKeys);

    this.services.set(sourceName, service);
    return service;
  }

  // ── Introspection ───────────────────────────────────────────────────────

  /**
   * Get the default source name.
   *
   * @returns The default source name
   */
  getDefaultSource(): string {
    return this.config.default;
  }

  /**
   * Get all configured source names.
   *
   * @returns Array of source names
   */
  getSourceNames(): string[] {
    return Object.keys(this.config.sources);
  }

  /**
   * Check if a source is configured.
   *
   * @param name - Source name to check
   * @returns `true` if the source exists in the configuration
   */
  hasSource(name: string): boolean {
    return name in this.config.sources;
  }

  // ── Source management ───────────────────────────────────────────────────

  /**
   * Forget a cached source and its ConfigService wrapper.
   * Forces re-creation on next `source()` call.
   *
   * @param name - Source name(s). Uses default if omitted.
   * @returns `this` for chaining
   */
  forgetSource(name?: string | string[]): this {
    const names = name ? (Array.isArray(name) ? name : [name]) : [this.config.default];

    for (const n of names) {
      this.services.delete(n);
    }
    return this.forgetInstance(name);
  }

  /**
   * Clear all cached sources and ConfigService wrappers.
   */
  override purge(): void {
    this.services.clear();
    super.purge();
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Merge custom configuration into a driver (sync).
   *
   * @param driver - The driver to merge config into
   * @param load - Config object or factory function
   */
  private mergeCustomConfig(
    driver: ConfigDriver & { merge?: (config: Record<string, any>) => void },
    load: Record<string, any> | (() => Record<string, any> | Promise<Record<string, any>>)
  ): void {
    const customConfig = typeof load === 'function' ? load() : load;

    if (customConfig instanceof Promise) {
      customConfig
        .then((config) => {
          if (driver.merge) driver.merge(config);
        })
        .catch((err) => {
          console.warn('[ConfigManager] Failed to merge async custom config:', err);
        });
    } else {
      if (driver.merge) driver.merge(customConfig);
    }
  }

  /**
   * Merge custom configuration into a driver (async).
   *
   * @param driver - The driver to merge config into
   * @param load - Config object or factory function
   */
  private async mergeCustomConfigAsync(
    driver: ConfigDriver & { merge?: (config: Record<string, any>) => void },
    load: Record<string, any> | (() => Record<string, any> | Promise<Record<string, any>>)
  ): Promise<void> {
    const customConfig = typeof load === 'function' ? await load() : load;
    if (driver.merge) driver.merge(customConfig);
  }
}
