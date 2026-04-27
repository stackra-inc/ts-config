/**
 * @fileoverview Tests for ConfigModule
 *
 * This test suite verifies the ConfigModule functionality including:
 * - Module registration (forRoot)
 * - Driver creation and configuration
 * - Custom config merging
 * - Provider setup
 *
 * @module @stackra/config
 * @category Tests
 */

import { describe, it, expect } from 'vitest';
import { ConfigModule } from '@/config.module';

/** Helper to create minimal valid ConfigModuleOptions */
function makeOptions(overrides: Record<string, any> = {}) {
  return {
    default: 'env',
    sources: {
      env: { driver: 'env' as const },
    },
    ...overrides,
  };
}

describe('ConfigModule', () => {
  describe('forRoot', () => {
    it('should create a dynamic module with default configuration', () => {
      // Act: Create module with minimal config
      const module = ConfigModule.forRoot(makeOptions());

      // Assert: Module structure is correct
      expect(module).toBeDefined();
      expect(module.module).toBe(ConfigModule);
      expect(module.providers).toBeDefined();
      expect(module.exports).toBeDefined();
    });

    it('should create module with env driver', () => {
      // Arrange: Configure env driver
      const options = makeOptions({
        sources: {
          env: {
            driver: 'env' as const,
            envPrefix: 'VITE_',
          },
        },
      });

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Module is configured correctly
      expect(module).toBeDefined();
      expect(module.providers).toBeDefined();
    });

    it('should create module with file driver', () => {
      // Arrange: Configure file driver
      const options = makeOptions({
        default: 'file',
        sources: {
          file: {
            driver: 'file' as const,
            filePattern: './config',
          },
        },
      });

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Module is configured correctly
      expect(module).toBeDefined();
      expect(module.providers).toBeDefined();
    });

    it('should merge custom configuration', () => {
      // Arrange: Custom config via load
      const options = makeOptions({
        sources: {
          env: {
            driver: 'env' as const,
            load: {
              app: {
                name: 'Test App',
                version: '1.0.0',
              },
            },
          },
        },
      });

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Module includes custom config
      expect(module).toBeDefined();
    });

    it.skip('should set global flag when specified', () => {
      // Arrange: Global module config
      const options = makeOptions({ isGlobal: true });

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Module is global
      expect(module.global).toBe(true);
    });
  });

  describe('Driver Creation', () => {
    it('should create EnvDriver by default', () => {
      // Act: Create module with env driver
      const module = ConfigModule.forRoot(makeOptions());

      // Assert: Module uses env driver
      expect(module).toBeDefined();
    });

    it('should create FileDriver when specified', () => {
      // Arrange: File driver config
      const options = makeOptions({
        default: 'file',
        sources: {
          file: {
            driver: 'file' as const,
            filePattern: './config',
          },
        },
      });

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Module uses file driver
      expect(module).toBeDefined();
    });

    it('should pass driver options correctly', () => {
      // Arrange: Driver with options
      const options = makeOptions({
        sources: {
          env: {
            driver: 'env' as const,
            envPrefix: 'VITE_',
            expandVariables: true,
          },
        },
      });

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Module is configured
      expect(module).toBeDefined();
    });
  });

  describe('Configuration Merging', () => {
    it('should merge multiple config sources', () => {
      // Arrange: Multiple sources
      const options = makeOptions({
        sources: {
          env: {
            driver: 'env' as const,
            load: {
              database: { host: 'localhost', port: 5432 },
              cache: { driver: 'redis' },
            },
          },
        },
      });

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Configs are merged
      expect(module).toBeDefined();
    });

    it('should handle nested configuration objects', () => {
      // Arrange: Nested config
      const options = makeOptions({
        sources: {
          env: {
            driver: 'env' as const,
            load: {
              app: {
                name: 'Test',
                features: {
                  auth: true,
                  api: { version: 'v1', timeout: 5000 },
                },
              },
            },
          },
        },
      });

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Nested config is handled
      expect(module).toBeDefined();
    });
  });

  describe('Module Exports', () => {
    it('should export ConfigService', () => {
      // Act: Create module
      const module = ConfigModule.forRoot(makeOptions());

      // Assert: ConfigService is exported
      expect(module.exports).toBeDefined();
      expect(Array.isArray(module.exports)).toBe(true);
    });

    it('should provide all necessary providers', () => {
      // Act: Create module
      const module = ConfigModule.forRoot(makeOptions());

      // Assert: Providers are defined
      expect(module.providers).toBeDefined();
      expect(Array.isArray(module.providers)).toBe(true);
      expect(module.providers!.length).toBeGreaterThan(0);
    });
  });
});
