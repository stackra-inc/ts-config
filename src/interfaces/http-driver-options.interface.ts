/**
 * HTTP Driver Options Interface
 *
 * Configuration options for the HTTP-based configuration driver.
 * The actual HTTP requests are made via `@stackra/ts-http`'s `HttpClient`,
 * which is injected through DI. These options control what to fetch
 * and how to transform the response.
 *
 * @module interfaces/http-driver-options
 */

/**
 * Options for configuring the `HttpDriver`.
 *
 * @example
 * ```typescript
 * // Simple REST API
 * const options: HttpDriverOptions = {
 *   url: '/api/config',
 * };
 *
 * // AWS AppConfig via HTTP endpoint
 * const options: HttpDriverOptions = {
 *   url: 'http://localhost:2772/applications/MyApp/environments/prod/configurations/MyConfig',
 * };
 *
 * // Firebase Remote Config with transform
 * const options: HttpDriverOptions = {
 *   url: '/v1/projects/my-project/remoteConfig',
 *   transform: (data) => {
 *     const params: Record<string, any> = {};
 *     for (const [key, value] of Object.entries(data.parameters || {})) {
 *       params[key] = (value as any).defaultValue?.value;
 *     }
 *     return params;
 *   },
 * };
 * ```
 */
export interface HttpDriverOptions {
  /**
   * The URL (or path relative to `HttpClient`'s baseURL) to fetch
   * configuration from.
   */
  url: string;

  /**
   * Transform the raw response data before storing it.
   *
   * Useful for normalizing responses from services like Firebase
   * Remote Config or AWS AppConfig that wrap values in metadata.
   *
   * If omitted, the response `data` is used as-is.
   *
   * @param data - The raw JSON response body
   * @returns The normalized configuration object
   */
  transform?: (data: any) => Record<string, any>;

  /**
   * Number of retry attempts on failure.
   *
   * @default 0
   */
  retries?: number;

  /**
   * Delay between retries in milliseconds.
   *
   * @default 1000
   */
  retryDelay?: number;
}
