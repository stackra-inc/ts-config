/**
 * Config Package Configuration
 *
 * Configuration for the @stackra/ts-config package.
 * Defines how configuration is loaded and accessed across the application.
 *
 * ## Available Drivers
 *
 * | Driver   | Source                                      |
 * |----------|---------------------------------------------|
 * | `'env'`  | `import.meta.env` or `window.__APP_CONFIG__`    |
 * | `'file'` | TypeScript/JavaScript/JSON config files      |
 * | `'http'` | Remote HTTP endpoint (API, AWS, Firebase)    |
 *
 * @module config/config
 */

import { defineConfig } from '@stackra/config';

/**
 * Config Configuration
 *
 * @example
 * ```typescript
 * // In app.module.ts
 * import { configConfig } from '@/config/config.config';
 *
 * @Module({
 *   imports: [ConfigModule.forRoot(configConfig)],
 * })
 * export class AppModule {}
 * ```
 */
export const configConfig = defineConfig({
  // ── Module-level options ─────────────────────────────────────────────

  /**
   * Default config source name.
   * Must match one of the keys in `sources`.
   */
  default: 'env',

  /**
   * Make config globally available to all modules.
   * @default true
   */
  // isGlobal: true,

  /**
   * Enable debug logging for all driver operations.
   * @default false
   */
  // debug: false,

  /**
   * Keys to redact in `config.toSafeObject()` output.
   * Prevents accidental exposure in logs, error reports, or dumps.
   */
  // sensitiveKeys: ['JWT_SECRET', 'DB_PASSWORD', 'API_KEY', 'STRIPE_SECRET'],

  /**
   * Validate the default source's config after loading.
   * Throw an error to reject invalid configuration.
   */
  // validate: (config) => {
  //   if (!config.APP_NAME) {
  //     throw new Error('APP_NAME is required');
  //   }
  // },

  // ── Named sources ───────────────────────────────────────────────────

  sources: {
    // ── Env Driver ───────────────────────────────────────────────────
    env: {
      /**
       * Reads from `import.meta.env` (Node.js) or `window.__APP_CONFIG__` (browser).
       * The Vite plugin injects env vars into the browser global at build time.
       */
      driver: 'env',

      /**
       * Auto-detect and strip environment variable prefix.
       * - 'auto' — detects VITE_ or NEXT_PUBLIC_ and strips it
       * - 'VITE_' — strips VITE_ prefix (VITE_APP_NAME → APP_NAME)
       * - 'NEXT_PUBLIC_' — strips NEXT_PUBLIC_ prefix
       * - false — disable prefix stripping
       * @default 'auto'
       */
      envPrefix: 'auto',

      /**
       * Expand ${VAR} references in values.
       * e.g. API_URL=${BASE_URL}/api → API_URL=http://localhost/api
       * @default false
       */
      // expandVariables: false,

      /**
       * Custom browser global variable name.
       * The Vite plugin injects config into window[globalName].
       * @default '__APP_CONFIG__'
       */
      // globalName: '__APP_CONFIG__',

      /**
       * Merge additional config on top of the driver's loaded values.
       * Supports static objects or async factory functions.
       */
      // load: { APP_VERSION: '1.0.0' },
      // load: async () => {
      //   const res = await fetch('/api/feature-flags');
      //   return res.json();
      // },
    },

    // ── File Driver ──────────────────────────────────────────────────
    // Uncomment to enable file-based configuration scanning.
    //
    // file: {
    //   /**
    //    * Scans for .config.ts files and merges their exports.
    //    */
    //   driver: 'file',
    //
    //   /**
    //    * Glob pattern(s) to match config files.
    //    * @default 'src/**/*.config.ts'
    //    */
    //   filePattern: ['config/**/*.config.ts', 'src/**/*.config.ts'],
    //
    //   /**
    //    * Root directory for scanning.
    //    * @default process.cwd()
    //    */
    //   // fileRoot: process.cwd(),
    //
    //   /**
    //    * Directories to exclude from scanning.
    //    * @default ['node_modules', 'dist', 'build', '.git']
    //    */
    //   // fileExcludeDirs: ['node_modules', 'dist', 'build', '.git'],
    //
    //   /**
    //    * Pre-loaded config object (skips file scanning).
    //    * Useful in browser environments where fs is not available.
    //    */
    //   // config: { database: { host: 'localhost', port: 5432 } },
    // },

    // ── HTTP Driver — REST API ───────────────────────────────────────
    // Uncomment to fetch config from a REST API endpoint.
    //
    // api: {
    //   driver: 'http',
    //   http: {
    //     /**
    //      * URL (or path relative to HttpClient's baseURL).
    //      */
    //     url: '/api/config',
    //
    //     /**
    //      * Retry on failure.
    //      * @default 0
    //      */
    //     // retries: 3,
    //
    //     /**
    //      * Delay between retries in ms.
    //      * @default 1000
    //      */
    //     // retryDelay: 2000,
    //   },
    // },

    // ── HTTP Driver — AWS AppConfig ──────────────────────────────────
    // Uncomment to fetch config from AWS AppConfig via the HTTP data plane.
    // Requires the AppConfig Agent running locally or as a Lambda extension.
    //
    // appconfig: {
    //   driver: 'http',
    //   http: {
    //     url: 'http://localhost:2772/applications/MyApp/environments/prod/configurations/MyConfig',
    //     retries: 3,
    //     retryDelay: 2000,
    //   },
    // },

    // ── HTTP Driver — Firebase Remote Config ─────────────────────────
    // Uncomment to fetch config from Firebase Remote Config REST API.
    // Auth is handled by HttpClient (configure in HttpModule.forRoot).
    //
    // firebase: {
    //   driver: 'http',
    //   http: {
    //     url: 'https://firebaseremoteconfig.googleapis.com/v1/projects/my-project/remoteConfig',
    //     /**
    //      * Firebase wraps values in a nested structure.
    //      * Transform normalizes it into a flat config object.
    //      */
    //     transform: (data) => {
    //       const params: Record<string, any> = {};
    //       for (const [key, value] of Object.entries(data.parameters || {})) {
    //         params[key] = (value as any).defaultValue?.value;
    //       }
    //       return params;
    //     },
    //     retries: 2,
    //   },
    // },
  },
});
