# alarife-cli - Command line interface tool for Alarife.

<div align="center">

[![NPM Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://www.npmjs.com/package/alarife-cli)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

**Alarife CLI tool, necessary to start applications developed under the Alarife framework.**

</div>

## 📋 Table of Contents

- [Installation](#-installation)
- [Commands](#-commands)
- [Basic Usage](#-basic-usage)
- [Detailed API](#-detailed-api)
- [License](#-license)

## 🚀 Installation

```bash
npm install @alarife/cli --save-dev
```

## ⚙️ Commands

### `run`

Run the specified entry point of your Alarife application.

```bash
alarife run <path>
```

| Argument | Description | Required |
|----------|-------------|----------|
| `path` | Path to the application entry point (e.g., `./dist/index.js`) | ✅ |

**Options:**

| Option | Short | Description | Type | Default | Env Variable |
|--------|-------|-------------|------|---------|--------------|
| `--configuration` | `-c` | Specify the configuration environment to use | `development` \| `production` \| `test` | `development` | `NODE_ENV` |
| `--debug` | `-d` | Enable debug mode for more verbose output | `boolean` | `false` | `DEBUG_MODE` |
| `--env-file` | | Specify a custom `.env` file to load environment variables from | `path` | | |
| `--system-env` | | Load environment variables directly from the system environment | `boolean` | `false` | |
| `--no-banner` | | Disable the display of the banner | `boolean` | | |
| `--secure-key` | | Provide a secure key to decrypt sensitive configuration values | `string` | | |

## 📦 Basic Usage

1. Install the CLI as a dev dependency in your Alarife project:

```bash
npm install @alarife/cli --save-dev
```

2. Add a start script to your `package.json`:

```json
{
  "scripts": {
    "start": "alarife run ./dist/index.js"
  }
}
```

3. Run your application:

```bash
npm start
```

**Running in production mode:**

```bash
alarife run ./dist/index.js --configuration production
```

**Running with a custom env file:**

```bash
alarife run ./dist/index.js --env-file .env.local
```

**Loading variables from the system environment:**

```bash
alarife run ./dist/index.js --system-env
```

> ⚠️ `--system-env` and `--env-file` are mutually exclusive and cannot be used together.

## 📖 Detailed API

### Configuration Loading

The CLI loads configuration through a layered system with the following priority (highest to lowest):

1. **Command-line arguments** — Values passed directly via CLI options.
2. **Environment variables / `.env` files** — Values loaded from the system environment or `.env` files. If no `--env-file` is specified, the CLI looks for `.env.<configuration>` (e.g., `.env.development`), falling back to `.env`.
3. **Default values** — Default values defined in the command options.

#### Environment variable sources

The `EnvConfigurationLoader` resolves environment variables from the following sources:

- **`--system-env`** — When enabled, the CLI loads variables directly from the running process environment (`process.env`). Values from a `.env` file (when one is resolved) take precedence over the system environment.
- **`--env-file <path>`** — Loads variables from the specified file. If the file does not exist, the CLI throws an error instead of silently falling back.
- **`.env.<configuration>` / `.env`** — When no `--env-file` is provided, the CLI looks for a configuration-specific file (e.g., `.env.production`) and falls back to the default `.env` file.

> ⚠️ `--system-env` and `--env-file` cannot be combined.

### Secure Configuration

The CLI supports decrypting sensitive configuration values at runtime via the `--secure-key` option. Any configuration value (loaded from `.env` files, environment variables, or CLI arguments) whose string starts with the `{cipher}` prefix is automatically decrypted before being passed to the application.

**Cryptographic scheme:**

| Property | Value |
|----------|-------|
| Key type | RSA (only RSA private keys are accepted) |
| Recommended key size | 2048 bits or higher |
| Key format | PEM-encoded PKCS#8 private key |
| Encryption padding | OAEP (`RSA_PKCS1_OAEP_PADDING`) |
| OAEP hash function | SHA-256 |
| Ciphertext encoding | Base64 |
| Value prefix | `{cipher}` |

**How it works:**

1. You generate an RSA key pair (the public key is used to encrypt values, the private key to decrypt them at runtime).
2. You encrypt each sensitive value with the public key using `RSA-OAEP` with `SHA-256`, then base64-encode the resulting ciphertext.
3. You store each encrypted value prefixed with `{cipher}`, e.g. `DB_PASSWORD={cipher}AbCdEf...==`.
4. At startup, you pass the path to the private key with `--secure-key`. The CLI iterates over the configuration state and decrypts every property whose value matches `{cipher}<base64>`.

**Step-by-step with `@alarife/tools`:**

The `@alarife/tools` package provides everything you need to generate keys and encrypt values without relying on OpenSSL.

```bash
npm install @alarife/tools --save-dev
```

**1. Generate an RSA key pair:**

The private key is saved to the given path, and the public key is printed to stdout (redirect it to a file to keep it).

```bash
alarife-tools generate-key ./ --key-type=rsa --key-format=pem
```

> The public key is displayed in the console for management by the user.

> The private key is exported as PKCS#8 PEM and the public key as SPKI PEM, matching the scheme expected at runtime.

**2. Encrypt each sensitive value with the public key:**

The output is already prefixed with `{cipher}`, ready to be stored.

```bash
alarife-tools encrypt "my-secret-value" ./public.pem --encoding=base64
# => {cipher}AbCdEf...==
```

Store each encrypted value in your `.env` file (or environment), e.g.:

```bash
DB_PASSWORD={cipher}AbCdEf...==
```

**3. (Optional) Decrypt a value to verify it:**

You can decrypt any `{cipher}` value with the private key to confirm it resolves correctly.

```bash
alarife-tools decrypt "{cipher}AbCdEf...==" ./private.pem --encoding=base64
# => my-secret-value
```


**4. Run your application with the private key:**

At startup, pass the path to the private key with `--secure-key`. The CLI automatically decrypts every `{cipher}` value before handing the configuration to your application.

```bash
alarife run ./dist/index.js --secure-key ./private.pem
```

> 📝 **Note:** The decrypted value only exists in memory. It is never written back to disk or persisted anywhere, so your encrypted `{cipher}` values remain the only stored representation.

> ⚠️ Only RSA private keys are accepted. Loading a key of any other type (e.g. EC, Ed25519) will throw an error at startup. Keep your private key out of version control.

### Plugin System

Alarife CLI automatically discovers plugins from your project's `node_modules`. A plugin is any package that includes an `alarife.json` file alongside its `package.json`.

**`alarife.json` structure:**

```json
{
  "cli": {
    "commands": [],
    "setup": "./path/to/setup.js",
    "showVersionInBanner": true
  }
}
```

| Property | Description |
|----------|-------------|
| `commands` | List of additional commands the plugin registers. |
| `setup` | Path to a setup script that receives the `ProgramLineInterface` instance and can extend the CLI. |
| `showVersionInBanner` | If `true`, the plugin version is displayed in the startup banner. |

### Custom Banner

You can customize the startup banner by placing a `banner.txt` file in the root of your project. If no custom banner is found, the default Alarife banner is displayed.

## 📄 License

This project is licensed under Apache-2.0. See the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Soria Garcia, Jose Eduardo](mailto:alarifeproyect@gmail.com)**

<sub>🌍 Product developed in Andalucia, España 🇪🇸</sub>

*Part of the Alarife ecosystem*

</div>

