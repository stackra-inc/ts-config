/**
 * Utilities Barrel Export
 *
 * Re-exports all utility functions used across the config package.
 *
 * - {@link defineConfig} — Type-safe helper for defining config module options
 * - {@link getNestedValue} — Dot-notation accessor for nested object values
 * - {@link hasNestedValue} — Dot-notation existence check for nested object values
 * - {@link loadConfigFile} — Dynamic loader for config files
 * - {@link scanConfigFiles} — File system scanner for config files
 * - {@link validatePluginConfig} — Plugin configuration validation and normalization
 * - {@link buildPluginConfig} — Merges env vars with scanned config files
 * - {@link generateVirtualModule} — Vite virtual module code generator
 *
 * @module utils
 */

// ── Core utilities ─────────────────────────────────────────────────────────

export { defineConfig } from './define-config.util';
export { getNestedValue, hasNestedValue } from './get-nested-value.util';
export { loadConfigFile } from './load-config-file.util';

// ── Build-time utilities (Vite plugin) ─────────────────────────────────────

export { scanConfigFiles } from './scan-config-files.util';
export { validatePluginConfig } from './validate-plugin-config.util';
export { buildPluginConfig } from './build-plugin-config.util';
export { generateVirtualModule } from './generate-virtual-module.util';
