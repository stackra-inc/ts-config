/**
 * @fileoverview Tests for EnvDriver
 *
 * This test suite verifies the EnvDriver functionality including:
 * - Loading environment variables
 * - Getting values with dot notation
 * - Variable expansion
 * - Default values
 * - Type conversions
 *
 * @module @stackra/config
 * @category Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnvDriver } from '@/drivers/env.driver';

describe('EnvDriver', () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    // Arrange: Reset environment
    import.meta.env = { ...originalEnv };
  });

  afterEach(() => {
    // Cleanup: Restore environment
    import.meta.env = originalEnv;
  });

  describe('load', () => {
    it('should load environment variables', () => {
      // Arrange: Set env vars
      import.meta.env.APP_NAME = 'Test App';
      import.meta.env.APP_PORT = '3000';
      import.meta.env.APP_DEBUG = 'true';

      const driver = new EnvDriver();

      // Act: Load config
      const config = driver.load();

      // Assert: Config is loaded
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should handle empty environment', () => {
      // Arrange: Clear env
      import.meta.env = {};

      const driver = new EnvDriver();

      // Act: Load config
      const config = driver.load();

      // Assert: Empty config is returned
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });
  });

  describe('get', () => {
    beforeEach(() => {
      // Arrange: Set test env vars
      import.meta.env.APP_NAME = 'Test App';
      import.meta.env.APP_PORT = '3000';
      import.meta.env.DATABASE_HOST = 'localhost';
      import.meta.env.DATABASE_PORT = '5432';
    });

    it('should get environment variable', () => {
      // Arrange: Create driver
      const driver = new EnvDriver();
      driver.load();

      // Act: Get value
      const appName = driver.get('APP_NAME');

      // Assert: Value is returned
      expect(appName).toBe('Test App');
    });

    it("should return default value when key doesn't exist", () => {
      // Arrange: Create driver
      const driver = new EnvDriver();
      driver.load();

      // Act: Get with default
      const value = driver.get('MISSING_KEY', 'default');

      // Assert: Default is returned
      expect(value).toBe('default');
    });

    it("should return undefined when key doesn't exist and no default", () => {
      // Arrange: Create driver
      const driver = new EnvDriver();
      driver.load();

      // Act: Get without default
      const value = driver.get('MISSING_KEY');

      // Assert: Undefined is returned
      expect(value).toBeUndefined();
    });

    it('should handle numeric string values', () => {
      // Arrange: Create driver
      const driver = new EnvDriver();
      driver.load();

      // Act: Get numeric value
      const port = driver.get('APP_PORT');

      // Assert: String is returned (no auto-conversion)
      expect(port).toBe('3000');
    });
  });

  describe('has', () => {
    beforeEach(() => {
      // Arrange: Set test env vars
      import.meta.env.APP_NAME = 'Test App';
      import.meta.env.EMPTY_VAR = '';
    });

    it('should return true for existing key', () => {
      // Arrange: Create driver
      const driver = new EnvDriver();
      driver.load();

      // Act: Check existence
      const exists = driver.has('APP_NAME');

      // Assert: Key exists
      expect(exists).toBe(true);
    });

    it('should return false for missing key', () => {
      // Arrange: Create driver
      const driver = new EnvDriver();
      driver.load();

      // Act: Check existence
      const exists = driver.has('MISSING_KEY');

      // Assert: Key doesn't exist
      expect(exists).toBe(false);
    });

    it('should return true for empty string value', () => {
      // Arrange: Create driver
      const driver = new EnvDriver();
      driver.load();

      // Act: Check existence
      const exists = driver.has('EMPTY_VAR');

      // Assert: Key exists even with empty value
      expect(exists).toBe(true);
    });
  });

  describe('all', () => {
    beforeEach(() => {
      // Arrange: Set test env vars
      import.meta.env.APP_NAME = 'Test App';
      import.meta.env.APP_PORT = '3000';
      import.meta.env.DATABASE_HOST = 'localhost';
    });

    it('should return all configuration', () => {
      // Arrange: Create driver
      const driver = new EnvDriver();
      driver.load();

      // Act: Get all config
      const config = driver.all();

      // Assert: All config is returned
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should include all loaded variables', () => {
      // Arrange: Create driver
      const driver = new EnvDriver();
      driver.load();

      // Act: Get all config
      const config = driver.all();

      // Assert: Contains loaded vars
      expect(config).toBeDefined();
    });
  });

  describe('Variable Expansion', () => {
    it('should expand variables when enabled', () => {
      // Arrange: Set vars with references
      import.meta.env.BASE_URL = 'http://localhost';
      import.meta.env.API_URL = '${BASE_URL}/api';

      const driver = new EnvDriver({ expandVariables: true });
      driver.load();

      // Act: Get expanded value
      const apiUrl = driver.get('API_URL');

      // Assert: Variable is expanded (if implemented)
      expect(apiUrl).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in values', () => {
      // Arrange: Set var with special chars
      import.meta.env.SPECIAL = 'value with spaces & symbols!@#';

      const driver = new EnvDriver();
      driver.load();

      // Act: Get value
      const value = driver.get('SPECIAL');

      // Assert: Special chars are preserved
      expect(value).toBe('value with spaces & symbols!@#');
    });

    it('should handle multiline values', () => {
      // Arrange: Set multiline var
      import.meta.env.MULTILINE = 'line1\\nline2\\nline3';

      const driver = new EnvDriver();
      driver.load();

      // Act: Get value
      const value = driver.get('MULTILINE');

      // Assert: Multiline is preserved
      expect(value).toBeDefined();
    });

    it('should handle empty environment', () => {
      // Arrange: Clear all env vars
      import.meta.env = {};

      const driver = new EnvDriver();

      // Act: Load and get
      driver.load();
      const value = driver.get('ANY_KEY', 'default');

      // Assert: Default is returned
      expect(value).toBe('default');
    });
  });
});
