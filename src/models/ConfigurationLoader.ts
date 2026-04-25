import { Option } from '@alarife/commander';
import { ConfigurationLoader, ConfigurationState } from '@alarife/configuration';
import dotenv from 'dotenv';
import { NODE_ENV } from '../constants/environment';
import {
  ARGV_NAME_CONFIGURATION,
  ARGV_NAME_ENV_FILE_CAMELCASE,
  ARGV_SHORT_NAME_CONFIGURATION
} from '../constants/arguments';
import { existsSync } from 'fs';

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

// import crypto from 'crypto';

// import { ConfigurationLoader } from './ConfigLoader';
// import { ConfigurationState } from './ConfigurationState';
// import { ENCRYPT_KEY } from './ConfigurationEnvKeys';

// const ALGORITHM = 'aes-256-gcm';
// const IV_LENGTH = 16;
// const AUTH_TAG_LENGTH = 16;
// const CIPHER_PREFIX = 'ENC[';

// export interface ConfigurationPostLoader extends ConfigurationLoader {}

// export class SecureConfigurationLoader extends ConfigurationLoader {
//   public priority: number = 4;
// private derivedKey?: Uint8Array;

// private createDerivedKey(password: string): void {
//   this.derivedKey = new Uint8Array(crypto.scryptSync(password, 'salt', 32));
// }

// private decrypt(cipherValue: string): string {
//   const payload = Buffer.from(cipherValue.slice(CIPHER_PREFIX.length), 'hex');

//   const iv = new Uint8Array(payload.subarray(0, IV_LENGTH));
//   const authTag = new Uint8Array(payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH));
//   const encrypted = new Uint8Array(payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH));

//   const decipher = crypto.createDecipheriv(ALGORITHM, this.derivedKey!, iv);
//   decipher.setAuthTag(authTag);

//   let decrypted = decipher.update(encrypted, undefined, 'utf8');
//   decrypted += decipher.final('utf8');
//   return decrypted;
// }

//   load(state: ConfigurationState): void {
// console.log("🚀 ~ SecureConfigurationPostLoader ~ load ~ state:", state)
// const encryptKey = 'age12hmtsadz37de2q85tvzvxyqs64h65fm8hlkcy8w93a4m6uglqcmq2rgerk';
// if (!encryptKey) {
//   return;
// }
// this.createDerivedKey(encryptKey);
// state.forEach((property) => {
//   console.log("🚀 ~ SecureConfigurationPostLoader ~ load ~ property:", property)
//   if (property.value && typeof property.value === 'string' && property.value.includes(CIPHER_PREFIX)) {
//     property.value = this.decrypt(property.value);
//     console.log("🚀 ~ SecureConfigurationPostLoader ~ load ~ property.value:", property.value)
//   }
// });
//   }
// }
