import { Command } from '@alarife/commander';
import { join } from 'path';

import {
  ARGV_NAME_CONFIGURATION,
  ARGV_NAME_DEBUG,
  ARGV_NAME_ENV_FILE,
  ARGV_NAME_NO_BANNER,
  ARGV_NAME_WATCH,
  ARGV_SHORT_NAME_CONFIGURATION,
  ARGV_SHORT_NAME_DEBUG
} from './arguments';
import { DEVELOPMENT, ENV_DEBUG_MODE, ENV_WATCH_MODE, NODE_ENV, PRODUCTION, TEST } from './environment';

export const RUN_COMMAND: Command = {
  name: 'run',
  description: 'Run the specified command.',
  path: join(__dirname, '../handlers/run.js'),
  arguments: [
    {
      description: 'Path to add license',
      required: true,
      descriptiveType: 'path'
    }
  ],
  options: [
    {
      name: ARGV_NAME_CONFIGURATION,
      shortName: ARGV_SHORT_NAME_CONFIGURATION,
      description: 'Specify the configuration environment to use (e.g., development, production, test).',
      descriptiveType: 'environment',
      choices: [DEVELOPMENT, PRODUCTION, TEST],
      defaultValue: DEVELOPMENT,
      env: NODE_ENV
    },
    {
      name: ARGV_NAME_DEBUG,
      shortName: ARGV_SHORT_NAME_DEBUG,
      description: 'Enable debug mode for more verbose output.',
      descriptiveType: 'boolean',
      defaultValue: false,
      env: ENV_DEBUG_MODE
    },
    {
      name: ARGV_NAME_WATCH,
      description: 'Watch for file changes and automatically restart the command.',
      descriptiveType: 'boolean',
      defaultValue: false,
      env: ENV_WATCH_MODE
    },
    {
      name: ARGV_NAME_ENV_FILE,
      description: 'Specify a custom .env file to load environment variables from.',
      descriptiveType: 'path',
    },
    {
      name: ARGV_NAME_NO_BANNER,
      description: 'Disable the display of the banner.',
      descriptiveType: 'boolean',
      defaultValue: false
    }
  ]
};

// export class DefaultConfigurationLoader extends ConfigurationLoader {
//   public priority: number = 1;

//   constructor(private command: { name: string; options: any[] }) {
//     super();
//   }

//   load(state: ConfigurationState): void {
//     this.command.options.forEach((option) => {
//       state.setProperty({ key: [option.env, option.name, option.shortName], value: option.defaultValue });
//     });
//   }
// }

// export class EnvConfigurationLoader extends ConfigurationLoader {
//   public priority: number = 2;

//   private loadEnvFile(path: string): Record<string, string> {
//     const configResult = dotenv.config({ path });
//     return configResult.parsed || {};
//   }

//   load(state: ConfigurationState): void {
//     // este hara esto, pero su implementacion estara en el CLI

//     const environment = state.getProperty(NODE_ENV);
//     if (environment) {
//       const envConfig = this.loadEnvFile(`.env.${environment}`);

//       // Object.keys(envConfig).forEach((key) => {
//       //   const appConfig = appConfigurationMap.find((config) => config.envKey === key);

//       //   state.setProperty({ argKey: appConfig?.argKey, envKey: key, value: envConfig[key] });
//       // });
//     }
//   }
// }

// export class ArgvConfigurationLoader extends ConfigurationLoader {
//   public priority: number = 3;

//   constructor(private command: { name: string; options: any[]; value: Record<string, any> }) {
//     super();
//   }

//   load(state: ConfigurationState): void {
//     this.command.options.forEach((option) => {
//       state.setProperty({ key: [option.env, option.name, option.shortName], value: this.command.value[option.name] });
//     });
//   }
// }

// el cli configura los parametros de cifrado no el config

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
