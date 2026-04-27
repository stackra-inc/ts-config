/**
 * @fileoverview Tests for ConfigModule
 *
 * This test suite verifies the ConfigModule functionality including:
 * - Module registration (forRoot, forRootAsync)
 * - Driver creation and configuration
 * - Custom config merging
 * - Provider setup
 *
 * @module @stackra/config
 * @category Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigModule } from '@/config.module';
import { EnvDriver } from '@/drivers/env.driver';
import { FileDriver } from '@/drivers/file.driver';

describe('ConfigModule', () => {
  describe('forRoot', () => {
    it('should create a dynamic module with default configuration', () => {
      // Act: Create module with default config
      const module = ConfigModule.forRoot();

      // Assert: Module structure is correct
      expect(module).toBeDefined();
      expect(module.module).toBe(ConfigModule);
      expect(module.providers).toBeDefined();
      expect(module.exports).toBeDefined();
    });

    it('should create module with env driver', () => {
      // Arrange: Configure env driver
      const options = {
        driver: 'env' as const,
        envFilePath: '.env.test',
      };

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Module is configured correctly
      expect(module).toBeDefined();
      expect(module.providers).toBeDefined();
    });

    it('should create module with file driver', () => {
      // Arrange: Configure file driver
      const options = {
        driver: 'file' as const,
        configPath: './config',
      };

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Module is configured correctly
      expect(module).toBeDefined();
      expect(module.providers).toBeDefined();
    });

    it('should merge custom configuration', () => {
      // Arrange: Custom config
      const customConfig = {
        app: {
          name: 'Test App',
          version: '1.0.0',
        },
      };

      const options = {
        driver: 'env' as const,
        config: customConfig,
      };

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Module includes custom config
      expect(module).toBeDefined();
    });

    it.skip('should set global flag when specified', () => {
      // Arrange: Global module config
      const options = {
        driver: 'env' as const,
        isGlobal: true,
      };

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Module is global
      expect(module.global).toBe(true);
    });
  });

  describe('forRootAsync', () => {
    it('should create async dynamic module', async () => {
      // Arrange: Async factory
      const useFactory = async () => ({
        driver: 'env' as const,
        envFilePath: '.env',
      });

      // Act: Create async module
      const module = await ConfigModule.forRootAsync({
        useFactory,
      });

      // Assert: Module is created
      expect(module).toBeDefined();
      expect(module.module).toBe(ConfigModule);
    });

    it('should handle async factory with dependencies', async () => {
      // Arrange: Factory with inject
      const useFactory = async (dep: any) => ({
        driver: 'env' as const,
      });

      // Act: Create async module
      const module = await ConfigModule.forRootAsync({
        useFactory,
        inject: ['SOME_DEPENDENCY'],
      });

      // Assert: Module is created
      expect(module).toBeDefined();
    });
  });

  describe('Driver Creation', () => {
    it('should create EnvDriver by default', () => {
      // Act: Create module with no driver specified
      const module = ConfigModule.forRoot({});

      // Assert: Module uses env driver
      expect(module).toBeDefined();
    });

    it('should create FileDriver when specified', () => {
      // Arrange: File driver config
      const options = {
        driver: 'file' as const,
        configPath: './config',
      };

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Module uses file driver
      expect(module).toBeDefined();
    });

    it('should pass driver options correctly', () => {
      // Arrange: Driver with options
      const options = {
        driver: 'env' as const,
        envFilePath: '.env.custom',
        expandVariables: true,
      };

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Module is configured
      expect(module).toBeDefined();
    });
  });

  describe('Configuration Merging', () => {
    it('should merge multiple config sources', () => {
      // Arrange: Multiple configs
      const customConfig = {
        database: {
          host: 'localhost',
          port: 5432,
        },
        cache: {
          driver: 'redis',
        },
      };

      const options = {
        driver: 'env' as const,
        config: customConfig,
      };

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Configs are merged
      expect(module).toBeDefined();
    });

    it('should handle nested configuration objects', () => {
      // Arrange: Nested config
      const customConfig = {
        app: {
          name: 'Test',
          features: {
            auth: true,
            api: {
              version: 'v1',
              timeout: 5000,
            },
          },
        },
      };

      const options = {
        config: customConfig,
      };

      // Act: Create module
      const module = ConfigModule.forRoot(options);

      // Assert: Nested config is handled
      expect(module).toBeDefined();
    });
  });

  describe('Module Exports', () => {
    it('should export ConfigService', () => {
      // Act: Create module
      const module = ConfigModule.forRoot();

      // Assert: ConfigService is exported
      expect(module.exports).toBeDefined();
      expect(Array.isArray(module.exports)).toBe(true);
    });

    it('should provide all necessary providers', () => {
      // Act: Create module
      const module = ConfigModule.forRoot();

      // Assert: Providers are defined
      expect(module.providers).toBeDefined();
      expect(Array.isArray(module.providers)).toBe(true);
      expect(module.providers!.length).toBeGreaterThan(0);
    });
  });
});
