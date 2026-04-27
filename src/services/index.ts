/**
 * Services Barrel Export
 *
 * Re-exports all service classes for the config package.
 *
 * - {@link ConfigManager} — Orchestrates multiple named config sources
 * - {@link ConfigService} — Consumer-facing API wrapping a single source
 *
 * @module services
 */

export { ConfigManager } from './config-manager.service';
export { ConfigService } from './config.service';
