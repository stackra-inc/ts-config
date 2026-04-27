/**
 * @stackra/ts-config
 *
 * Multi-source configuration management with multiple drivers for loading
 * configuration from various sources (environment variables, files, HTTP
 * endpoints, etc.). Provides type-safe access to configuration values
 * with support for nested properties and default values.
 *
 * Follows the manager pattern used by cache, logger, and redis packages:
 * - `ConfigManager` orchestrates multiple named config sources
 * - `ConfigService` wraps a single source with typed getters
 *
 * @example
 * ```typescript
 * import { ConfigModule, ConfigManager, CONFIG_SERVICE } from '@stackra/ts-config';
 * import { Module, Injectable, Inject } from '@stackra/ts-container';
 * import type { ConfigService } from '@stackra/ts-config';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({
 *       default: 'env',
 *       sources: {
 *         env: { driver: 'env', envPrefix: 'auto', ignoreEnvFile: true },
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * @Injectable()
 * class DatabaseService {
 *   constructor(@Inject(CONFIG_SERVICE) private config: ConfigService) {}
 *
 *   connect() {
 *     const host = this.config.getString('DB_HOST', 'localhost');
 *     const port = this.config.getNumber('DB_PORT', 5432);
 *   }
 * }
 * ```
 *
 * @module @stackra/ts-config
 */

// ============================================================================
// Module (DI Configuration)
// ============================================================================
export { ConfigModule } from './config.module';

// ============================================================================
// Core Services
// ============================================================================
export { ConfigManager } from './services/config-manager.service';
export { ConfigService } from './services/config.service';

// ============================================================================
// Drivers
// ============================================================================
export { EnvDriver } from './drivers/env.driver';
export { FileDriver } from './drivers/file.driver';
export { HttpDriver } from './drivers/http.driver';

// ============================================================================
// Interfaces
// ============================================================================
export type { ConfigDriver } from './interfaces/config-driver.interface';
export type {
  ConfigModuleOptions,
  ConfigSourceOptions,
} from './interfaces/config-module-options.interface';
export type { ConfigServiceInterface } from './interfaces/config-service.interface';
export type { HttpDriverOptions } from './interfaces/http-driver-options.interface';
export type { ViteConfigPluginOptions } from './interfaces/vite-config-plugin-options.interface';

// ============================================================================
// Constants / Tokens
// ============================================================================
export { CONFIG_OPTIONS, CONFIG_MANAGER, CONFIG_SERVICE } from './constants/tokens.constant';

// ============================================================================
// Facades
// ============================================================================
export { ConfigFacade } from './facades';

// ============================================================================
// Utilities
// ============================================================================
export { defineConfig } from './utils/define-config.util';
export { getNestedValue, hasNestedValue } from './utils/get-nested-value.util';
export { loadConfigFile } from './utils/load-config-file.util';
