import { existsSync, readFileSync } from 'fs';
import { privateDecrypt } from 'crypto';

import { Option } from '@alarife/commander';
import { ConfigurationLoader, ConfigurationState } from '@alarife/configuration';
import dotenv from 'dotenv';

import {
  ARGV_NAME_CONFIGURATION,
  ARGV_NAME_ENV_FILE_CAMELCASE,
  ARGV_NAME_SECURE_KEY,
  ARGV_SHORT_NAME_CONFIGURATION
} from '../constants/arguments';

/**
 * DefaultConfigurationLoader: Loads default values from the provided options.
 */
export class DefaultConfigurationLoader extends ConfigurationLoader {
  public priority: number = 1;

  constructor(private options: Option[] = []) {
    super();
  }

  load(state: ConfigurationState): void {
    this.options.forEach((option: Option) => {
      state.setProperty({
        env: option.env,
        argv: option.name,
        shortArgv: option.shortName,
        value: option.defaultValue
      });
    });
  }
}

/**
 * EnvConfigurationLoader: Loads values from environment variables and .env files, supporting configuration-specific .env files.
 */
export class EnvConfigurationLoader extends ConfigurationLoader {
  public priority: number = 2;

  constructor(
    private options: Option[] = [],
    private argvValues: Record<string, any> = {}
  ) {
    super();
  }

  private getEnvFilePath(): string | undefined {
    const envFilePathOption = this.argvValues[ARGV_NAME_ENV_FILE_CAMELCASE];
    if (envFilePathOption) {
      return envFilePathOption;
    }

    const configuration = this.argvValues[ARGV_NAME_CONFIGURATION] || process.env[ARGV_SHORT_NAME_CONFIGURATION];
    if (configuration) {
      return `.env.${configuration}`;
    }

    const defaultEnvFilePath = `.env`;
    if (existsSync(defaultEnvFilePath)) {
      return defaultEnvFilePath;
    }

    return undefined;
  }

  private loadEnvFile(path: string): Record<string, string> {
    if (!existsSync(path)) {
      throw new Error(`The specified env file does not exist: ${path}`);
    }

    const configResult = dotenv.config({ path });
    return configResult.parsed || {};
  }

  load(state: ConfigurationState): void {
    let envFilePath = this.getEnvFilePath();

    if (envFilePath) {
      const envConfig = this.loadEnvFile(envFilePath);
      this.options.forEach((option) => {
        if (option.env) {
          const value = envConfig[option.env];
          state.setProperty({
            env: option.env,
            argv: option.name,
            shortArgv: option.shortName,
            value
          });
        }
      });
    }
  }
}

/**
 * ArgvConfigurationLoader: Loads values directly from command-line arguments, supporting both long and short forms.
 */
export class ArgvConfigurationLoader extends ConfigurationLoader {
  public priority: number = 3;

  constructor(
    private options: Option[] = [],
    private argvValues: Record<string, any> = {}
  ) {
    super();
  }

  load(state: ConfigurationState): void {
    this.options.forEach((option: Option) => {
      let value;
      if (option.name) {
        value = this.argvValues[option.name];

        if (!value && option.shortName) {
          value = this.argvValues[option.shortName];
        }
      }

      state.setProperty({ env: option.env, argv: option.name, shortArgv: option.shortName, value });
    });
  }
}

const CIPHER_PREFIX = '{cipher}';

/**
 * SecureConfigurationLoader: Loads encrypted values from command-line arguments and decrypts them using a provided private key, supporting values prefixed with "{cipher}".
 */
export class SecureConfigurationLoader extends ConfigurationLoader {

  priority: number = 4;

  private decrypt(value: string, privateKeyPem: string): string {
    const encryptedData = value.replace(CIPHER_PREFIX, '');
    const decrypted = privateDecrypt(privateKeyPem, Buffer.from(encryptedData, 'base64'));
    return decrypted.toString('utf8');
  }

  load(state: ConfigurationState): void {
    const encryptKeyPath = state.getProperty(ARGV_NAME_SECURE_KEY)?.value;

    if (!encryptKeyPath) {
      return;
    }

    if (!existsSync(encryptKeyPath)) {
      throw new Error(`The specified key file does not exist: ${encryptKeyPath}`);
    }

    const privateKeyPem = readFileSync(encryptKeyPath, 'utf8');

    state.forEach((property) => {
      if (property.value && typeof property.value === 'string' && property.value.includes(CIPHER_PREFIX)) {
        property.value = this.decrypt(property.value, privateKeyPem);
      }
    });
  }
}
