/**
 * Config Package Configuration
 *
 * Configuration for the @stackra/ts-config package.
 * Defines how environment variables are loaded and accessed
 * through the ConfigFacade and ConfigManager.
 *
 * ## Environment Variables
 *
 * | Variable              | Description                          | Default   |
 * |-----------------------|--------------------------------------|-----------|
 * | `VITE_CONFIG_DRIVER`  | Default config source driver         | `'env'`   |
 * | `VITE_APP_NAME`       | Application name (stripped to APP_NAME) | —      |
 * | `VITE_*`              | All VITE_ prefixed vars are auto-stripped | —    |
 *
 * @module config/config
 */

import { defineConfig } from '@stackra/ts-config';

/**
 * Config configuration.
 *
 * Uses the `sources` structure to define named configuration sources.
 * The `default` key selects which source is used by `ConfigFacade.source()`.
 *
 * @example
 * ```typescript
 * // In app.module.ts
 * import configConfig from '@/config/config.config';
 *
 * @Module({
 *   imports: [ConfigModule.forRoot(configConfig)],
 * })
 * export class AppModule {}
 * ```
 */
const configConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Source
  |--------------------------------------------------------------------------
  |
  | The name of the default configuration source. Must match a key
  | in the `sources` object below.
  |
  */
  default: 'env',

  /*
  |--------------------------------------------------------------------------
  | Configuration Sources
  |--------------------------------------------------------------------------
  |
  | Named source configurations. Each source has a `driver` field that
  | determines how configuration values are loaded.
  |
  | Drivers:
  |   - 'env'       : Reads from import.meta.env (browser) or process.env (Node)
  |   - 'file'      : Reads from a JSON/YAML file
  |   - 'http'      : Fetches config from a remote endpoint
  |   - 'api'       : Reads from a REST API with auth
  |   - 'firebase'  : Reads from Firebase Remote Config
  |   - 'appconfig' : Reads from AWS AppConfig
  |
  */
  sources: {
    /**
     * Environment variable source.
     *
     * Reads from `import.meta.env` in the browser. The `envPrefix`
     * option auto-detects and strips VITE_ or NEXT_PUBLIC_ prefixes
     * so that `VITE_APP_NAME` becomes accessible as `APP_NAME`.
     *
     * @default 'env'
     */
    env: {
      driver: 'env',

      /**
       * Auto-detect and strip environment variable prefix.
       * 'auto' detects VITE_ or NEXT_PUBLIC_ and strips it.
       * @default 'auto'
       */
      envPrefix: 'auto',
    },

    // ── Commented-out driver examples ─────────────────────────────
    //
    // file: {
    //   driver: 'file',
    //   path: './config/app.json',
    //   format: 'json',
    // },
    //
    // http: {
    //   driver: 'http',
    //   url: 'https://config.example.com/api/config',
    //   headers: { Authorization: 'Bearer <token>' },
    //   ttl: 300,
    // },
    //
    // api: {
    //   driver: 'api',
    //   baseUrl: 'https://api.example.com',
    //   endpoint: '/config',
    //   auth: { type: 'bearer', token: '<token>' },
    // },
    //
    // firebase: {
    //   driver: 'firebase',
    //   projectId: 'my-project',
    //   fetchInterval: 3600,
    // },
    //
    // appconfig: {
    //   driver: 'appconfig',
    //   application: 'my-app',
    //   environment: 'production',
    //   configuration: 'feature-flags',
    //   region: 'us-east-1',
    // },
  },
});

export default configConfig;
