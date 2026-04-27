/**
 * Configuration Module
 *
 * Registers:
 * - `CONFIG_OPTIONS` — raw config object
 * - `ConfigManager` — created by DI so @Inject decorators fire
 * - `CONFIG_MANAGER` — useExisting alias to ConfigManager
 * - `CONFIG_SERVICE` — factory that returns the default source's ConfigService
 *
 * Users inject `CONFIG_MANAGER` (or `ConfigManager` directly) and call
 * `manager.source()` to get a `ConfigService`, or inject `CONFIG_SERVICE`
 * to get the default source's service directly.
 *
 * @module config.module
 */

import { Module, type DynamicModule } from '@stackra/ts-container';

import type { ConfigModuleOptions } from './interfaces/config-module-options.interface';
import { ConfigManager } from './services/config-manager.service';
import { CONFIG_OPTIONS, CONFIG_MANAGER, CONFIG_SERVICE } from './constants/tokens.constant';

/**
 * ConfigModule — provides multi-source configuration management with DI.
 *
 * Follows the standard manager DI pattern:
 * - `CONFIG_OPTIONS` — raw config object
 * - `ConfigManager` — class-based injection
 * - `CONFIG_MANAGER` — useExisting alias
 * - `CONFIG_SERVICE` — default source's ConfigService
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({
 *       default: 'env',
 *       sources: {
 *         env: {
 *           driver: 'env',
 *           envPrefix: 'auto',
 *           ignoreEnvFile: true,
 *         },
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example
 * ```typescript
 * // Multi-source with HTTP
 * @Module({
 *   imports: [
 *     HttpModule.forRoot({ baseURL: 'https://api.example.com' }),
 *     ConfigModule.forRoot({
 *       default: 'env',
 *       sources: {
 *         env: { driver: 'env', envPrefix: 'auto' },
 *         api: { driver: 'http', http: { url: '/config' } },
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: Module pattern requires static methods
export class ConfigModule {
  /**
   * Configure the config module with runtime configuration.
   *
   * Registers four providers as global singletons:
   *
   * 1. `CONFIG_OPTIONS` — the raw {@link ConfigModuleOptions} object
   * 2. `ConfigManager` — the class-based provider, created by DI
   * 3. `CONFIG_MANAGER` — a token-based alias to ConfigManager
   * 4. `CONFIG_SERVICE` — factory returning the default source's ConfigService
   *
   * @param config - Config module options defining sources and default
   * @returns A DynamicModule with all config providers registered and exported
   *
   * @example
   * ```typescript
   * ConfigModule.forRoot({
   *   default: 'env',
   *   sources: {
   *     env: { driver: 'env', envPrefix: 'auto' },
   *   },
   * })
   * ```
   */
  static forRoot(config: ConfigModuleOptions): DynamicModule {
    return {
      module: ConfigModule,
      global: config.isGlobal ?? true,
      providers: [
        { provide: CONFIG_OPTIONS, useValue: config },
        { provide: ConfigManager, useClass: ConfigManager },
        { provide: CONFIG_MANAGER, useExisting: ConfigManager },
        {
          provide: CONFIG_SERVICE,
          useFactory: (manager: ConfigManager) => manager.source(),
          inject: [ConfigManager],
        },
      ],
      exports: [ConfigManager, CONFIG_MANAGER, CONFIG_OPTIONS, CONFIG_SERVICE],
    };
  }
}
