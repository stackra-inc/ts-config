/**
 * Interfaces Barrel Export
 *
 * Re-exports all public interfaces and type aliases for the config package.
 *
 * - {@link ConfigDriver} — Contract for configuration driver implementations
 * - {@link ConfigModuleOptions} — Options for `ConfigModule.forRoot()`
 * - {@link ConfigSourceOptions} — Options for a single named config source
 * - {@link ConfigServiceInterface} — Contract for the configuration service
 * - {@link HttpDriverOptions} — Options for the HTTP configuration driver
 * - {@link ViteConfigPluginOptions} — Options for the Vite config plugin
 *
 * @module interfaces
 */

export type { ConfigDriver } from './config-driver.interface';
export type { ConfigModuleOptions, ConfigSourceOptions } from './config-module-options.interface';
export type { ConfigServiceInterface } from './config-service.interface';
export type { HttpDriverOptions } from './http-driver-options.interface';
export type { ViteConfigPluginOptions } from './vite-config-plugin-options.interface';
