/**
 * Dependency Injection Tokens
 *
 * Symbol-based tokens for the config package DI system.
 * Used with `@stackra/ts-container` for dependency injection.
 *
 * @module constants/tokens
 */

/**
 * Configuration options token.
 *
 * Injects the raw `ConfigModuleOptions` object passed to `ConfigModule.forRoot()`.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class MyService {
 *   constructor(@Inject(CONFIG_OPTIONS) private options: ConfigModuleOptions) {}
 * }
 * ```
 */
export const CONFIG_OPTIONS = Symbol.for('CONFIG_OPTIONS');

/**
 * Configuration manager token.
 *
 * `useExisting` alias to `ConfigManager`. Allows injection via
 * token instead of class reference.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class MyService {
 *   constructor(@Inject(CONFIG_MANAGER) private manager: ConfigManager) {}
 * }
 * ```
 */
export const CONFIG_MANAGER = Symbol.for('CONFIG_MANAGER');

/**
 * Configuration service token.
 *
 * Injects the default `ConfigService` instance (wrapping the default source).
 * This is the most common injection point for consumers.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class MyService {
 *   constructor(@Inject(CONFIG_SERVICE) private config: ConfigService) {}
 * }
 * ```
 */
export const CONFIG_SERVICE = Symbol.for('CONFIG_SERVICE');
