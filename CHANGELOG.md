# @stackra/ts-config

## 1.0.0

### Major Features

- 🎉 Initial release of @stackra/ts-config
- 🔧 `ConfigModule.forRoot()` with DynamicModule pattern
- 📦 `ConfigService` with type-safe getters (`getString`, `getNumber`,
  `getBool`, `getArray`, `getJson`)
- 🌍 `EnvDriver` for environment variable loading with `.env` file support
- 📁 `FileDriver` for object-based configuration
- 🔄 Variable expansion (`${VAR}` syntax) in env files
- 🏷️ Auto-prefix stripping via `envPrefix` option
- 💾 Built-in caching for configuration values
- 🔍 `getOrThrow` variants for required config keys
- 📂 Multiple env file support (`envFilePath` accepts arrays)
- ✅ Custom validation via `validate` callback
- 🌐 `isGlobal` flag for global module registration
- 🏗️ DI tokens: `CONFIG_OPTIONS`, `CONFIG_DRIVER`, `CONFIG_SERVICE`
- 🛠️ Utility exports: `defineConfig`, `getNestedValue`, `hasNestedValue`,
  `loadConfigFile`
