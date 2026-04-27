/**
 * @fileoverview Tests for ConfigService
 *
 * This test suite verifies the ConfigService functionality including:
 * - Getting configuration values
 * - Type-safe getters (getString, getNumber, getBool)
 * - Throwing methods (getOrThrow, getStringOrThrow)
 * - Default value handling
 * - Nested key access
 *
 * @module @stackra/config
 * @category Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '@/services/config.service';
import type { ConfigDriver } from '@/interfaces/config-driver.interface';

describe('ConfigService', () => {
  let mockDriver: ConfigDriver;
  let configService: ConfigService;

  beforeEach(() => {
    // Arrange: Create mock driver
    mockDriver = {
      load: vi.fn().mockReturnValue({
        app: {
          name: 'Test App',
          port: 3000,
          debug: true,
        },
        database: {
          host: 'localhost',
          port: 5432,
          name: 'testdb',
        },
        api: {
          key: 'test-key-123',
          timeout: 5000,
        },
      }),
      get: vi.fn((key: string, defaultValue?: unknown) => {
        const data: Record<string, unknown> = {
          'app.name': 'Test App',
          'app.port': 3000,
          'app.debug': true,
          'database.host': 'localhost',
          'database.port': 5432,
          'api.key': 'test-key-123',
        };
        return data[key] ?? defaultValue;
      }) as ConfigDriver['get'],
      has: vi.fn((key: string) => {
        const keys = [
          'app.name',
          'app.port',
          'app.debug',
          'database.host',
          'database.port',
          'api.key',
        ];
        return keys.includes(key);
      }),
      all: vi.fn().mockReturnValue({
        app: { name: 'Test App', port: 3000, debug: true },
        database: { host: 'localhost', port: 5432, name: 'testdb' },
      }),
    };

    configService = new ConfigService(mockDriver);
  });

  describe('get', () => {
    it('should get existing configuration value', () => {
      // Act: Get config value
      const appName = configService.get('app.name');

      // Assert: Value is returned
      expect(appName).toBe('Test App');
      expect(mockDriver.get).toHaveBeenCalledWith('app.name', undefined);
    });

    it("should return default value when key doesn't exist", () => {
      // Arrange: Mock missing key
      mockDriver.get = vi.fn((_key, defaultValue) => defaultValue) as ConfigDriver['get'];

      // Act: Get with default
      const value = configService.get('missing.key', 'default');

      // Assert: Default is returned
      expect(value).toBe('default');
    });

    it("should return undefined when key doesn't exist and no default", () => {
      // Arrange: Mock missing key
      mockDriver.get = vi.fn(() => undefined) as ConfigDriver['get'];

      // Act: Get without default
      const value = configService.get('missing.key');

      // Assert: Undefined is returned
      expect(value).toBeUndefined();
    });

    it('should handle nested keys', () => {
      // Act: Get nested value
      const dbHost = configService.get('database.host');

      // Assert: Nested value is returned
      expect(dbHost).toBe('localhost');
    });

    it('should handle numeric values', () => {
      // Act: Get numeric value
      const port = configService.get<number>('app.port');

      // Assert: Number is returned
      expect(port).toBe(3000);
      expect(typeof port).toBe('number');
    });

    it('should handle boolean values', () => {
      // Act: Get boolean value
      const debug = configService.get<boolean>('app.debug');

      // Assert: Boolean is returned
      expect(debug).toBe(true);
      expect(typeof debug).toBe('boolean');
    });
  });

  describe('getOrThrow', () => {
    it('should return value when key exists', () => {
      // Act: Get existing key
      const appName = configService.getOrThrow('app.name');

      // Assert: Value is returned
      expect(appName).toBe('Test App');
    });

    it("should throw error when key doesn't exist", () => {
      // Arrange: Mock missing key
      mockDriver.get = vi.fn(() => undefined) as ConfigDriver['get'];

      // Act & Assert: Should throw
      expect(() => {
        configService.getOrThrow('missing.key');
      }).toThrow();
    });

    it('should throw with descriptive error message', () => {
      // Arrange: Mock missing key
      mockDriver.get = vi.fn(() => undefined) as ConfigDriver['get'];

      // Act & Assert: Should throw with message
      expect(() => {
        configService.getOrThrow('missing.key');
      }).toThrow(/missing\.key/);
    });
  });

  describe('getString', () => {
    it('should return string value', () => {
      // Act: Get string
      const appName = configService.getString('app.name');

      // Assert: String is returned
      expect(appName).toBe('Test App');
      expect(typeof appName).toBe('string');
    });

    it("should return default string when key doesn't exist", () => {
      // Arrange: Mock missing key
      mockDriver.get = vi.fn((_key, defaultValue) => defaultValue) as ConfigDriver['get'];

      // Act: Get with default
      const value = configService.getString('missing.key', 'default');

      // Assert: Default is returned
      expect(value).toBe('default');
    });

    it('should return undefined when no default provided', () => {
      // Arrange: Mock missing key
      mockDriver.get = vi.fn(() => undefined) as ConfigDriver['get'];

      // Act: Get without default
      const value = configService.getString('missing.key');

      // Assert: Undefined is returned
      expect(value).toBeUndefined();
    });
  });

  describe('getStringOrThrow', () => {
    it('should return string value when key exists', () => {
      // Act: Get existing string
      const apiKey = configService.getStringOrThrow('api.key');

      // Assert: String is returned
      expect(apiKey).toBe('test-key-123');
      expect(typeof apiKey).toBe('string');
    });

    it("should throw when key doesn't exist", () => {
      // Arrange: Mock missing key
      mockDriver.get = vi.fn(() => undefined) as ConfigDriver['get'];

      // Act & Assert: Should throw
      expect(() => {
        configService.getStringOrThrow('missing.key');
      }).toThrow();
    });
  });

  describe('getNumber', () => {
    it('should return number value', () => {
      // Act: Get number
      const port = configService.getNumber('app.port');

      // Assert: Number is returned
      expect(port).toBe(3000);
      expect(typeof port).toBe('number');
    });

    it("should return default number when key doesn't exist", () => {
      // Arrange: Mock missing key
      mockDriver.get = vi.fn((_key, defaultValue) => defaultValue) as ConfigDriver['get'];

      // Act: Get with default
      const value = configService.getNumber('missing.key', 8080);

      // Assert: Default is returned
      expect(value).toBe(8080);
    });

    it('should parse string numbers', () => {
      // Arrange: Mock string number
      mockDriver.get = vi.fn(() => '5432') as ConfigDriver['get'];

      // Act: Get as number
      const port = configService.getNumber('database.port');

      // Assert: Parsed number is returned
      expect(port).toBe(5432);
      expect(typeof port).toBe('number');
    });
  });

  describe('getBool', () => {
    it('should return boolean value', () => {
      // Act: Get boolean
      const debug = configService.getBool('app.debug');

      // Assert: Boolean is returned
      expect(debug).toBe(true);
      expect(typeof debug).toBe('boolean');
    });

    it('should parse string booleans', () => {
      // Arrange: Mock string boolean
      mockDriver.get = vi.fn((key: string) => {
        if (key === 'feature.enabled') return 'true';
        if (key === 'feature.disabled') return 'false';
        return undefined;
      }) as ConfigDriver['get'];

      // Act: Get as boolean
      const enabled = configService.getBool('feature.enabled');
      const disabled = configService.getBool('feature.disabled');

      // Assert: Parsed booleans are returned
      expect(enabled).toBe(true);
      expect(disabled).toBe(false);
    });

    it('should handle truthy/falsy values', () => {
      // Arrange: Mock various values
      mockDriver.get = vi.fn((key: string) => {
        if (key === 'one') return 1;
        if (key === 'zero') return 0;
        if (key === 'yes') return 'yes';
        if (key === 'no') return 'no';
        return undefined;
      }) as ConfigDriver['get'];

      // Act: Get as booleans
      const one = configService.getBool('one');
      const zero = configService.getBool('zero');
      const yes = configService.getBool('yes');
      const no = configService.getBool('no');

      // Assert: Values are converted to boolean
      expect(one).toBe(true);
      expect(zero).toBe(false);
      expect(yes).toBe(true);
      expect(no).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      // Arrange: Mock null value
      mockDriver.get = vi.fn(() => null) as ConfigDriver['get'];

      // Act: Get null value
      const value = configService.get('null.key');

      // Assert: Null is returned
      expect(value).toBeNull();
    });

    it('should handle empty string values', () => {
      // Arrange: Mock empty string
      mockDriver.get = vi.fn(() => '') as ConfigDriver['get'];

      // Act: Get empty string
      const value = configService.getString('empty.key');

      // Assert: Empty string is returned
      expect(value).toBe('');
    });

    it('should handle zero values', () => {
      // Arrange: Mock zero
      mockDriver.get = vi.fn(() => 0) as ConfigDriver['get'];

      // Act: Get zero
      const value = configService.getNumber('zero.key');

      // Assert: Zero is returned
      expect(value).toBe(0);
    });
  });
});
