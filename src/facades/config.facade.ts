/**
 * Config Facade
 *
 * Typed proxy for {@link ConfigManager} from `@stackra/ts-config`.
 *
 * Multi-source configuration manager. Manages named sources (env, file, http).
 *
 * The facade is a module-level constant typed as `ConfigManager`.
 * It lazily resolves the service from the DI container on first property
 * access — safe to use at module scope before bootstrap completes.
 *
 * ## Setup (once, in main.tsx)
 *
 * ```typescript
 * import { Application } from '@stackra/ts-container';
 * import { Facade } from '@stackra/ts-support';
 *
 * const app = await Application.create(AppModule);
 * Facade.setApplication(app); // wires all facades
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { ConfigFacade } from '@stackra/ts-config';
 *
 * // Full autocomplete — no .proxy() call needed
 * ConfigFacade.source();
 * ```
 *
 * ## Available methods (from {@link ConfigManager})
 *
 * - `source(name?: string): ConfigService`
 * - `extend(driver: string, creator: DriverCreator<ConfigDriver>): this`
 * - `getDefaultInstance(): string`
 *
 * ## Testing — swap in a mock
 *
 * ```typescript
 * import { Facade } from '@stackra/ts-support';
 * import { ConfigManager } from '@/services/config-manager.service';
 *
 * // Before test — replace the resolved instance
 * Facade.swap(ConfigManager, mockInstance);
 *
 * // After test — restore
 * Facade.clearResolvedInstances();
 * ```
 *
 * @module facades/config
 * @see {@link ConfigManager} — the underlying service
 * @see {@link Facade} — the base class providing `make()`
 */

import { Facade } from '@stackra/ts-support';
import { ConfigManager } from '@/services/config-manager.service';

/**
 * ConfigFacade — typed proxy for {@link ConfigManager}.
 *
 * Resolves `ConfigManager` from the DI container via the `ConfigManager` token.
 * All property and method access is forwarded to the resolved instance
 * with correct `this` binding.
 *
 * Call `Facade.setApplication(app)` once during bootstrap before using this.
 *
 * @example
 * ```typescript
 * ConfigFacade.source();
 * ```
 */
export const ConfigFacade: ConfigManager = Facade.make<ConfigManager>(ConfigManager);
