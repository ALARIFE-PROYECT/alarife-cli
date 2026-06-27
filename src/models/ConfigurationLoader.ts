import { existsSync, readFileSync } from 'fs';
import { privateDecrypt, createPrivateKey, constants } from 'crypto';
import { join, resolve } from 'path';

import { Option } from '@alarife/commander';
import { ConfigurationLoader, ConfigurationState } from '@alarife/configuration';
import dotenv from 'dotenv';

import {
  ARGV_NAME_CONFIGURATION,
  ARGV_NAME_ENV_FILE,
  ARGV_NAME_SECURE_KEY,
  ARGV_NAME_SYSTEM_ENV,
  ARGV_SHORT_NAME_CONFIGURATION
} from '../constants/arguments';
import { ROOT_PATH } from '../constants/common';

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

  /**
   * Funcion de busqueda de archivo .env
   *
   * @returns {string | undefined} - path.
   */
  private getEnvFilePath(): string | undefined {
    /**
     * * 1. Se comprueba el argumento --env-file
     * Si existe se carga el archivo especificado, si no existe se lanza un error
     */
    const envFilePathOption = this.argvValues[ARGV_NAME_ENV_FILE];
    if (envFilePathOption) {
      const envFilePath = join(ROOT_PATH, envFilePathOption);
      const envFileExists = existsSync(envFilePath);
      if (envFilePathOption && envFileExists) {
        return envFilePath;
      } else if (envFilePathOption && !envFileExists) {
        throw new Error(`The specified env file does not exist: ${envFilePathOption}`);
      }
    }

    /**
     * * 2. Se comprueba si existe --configuration
     * se busca un archivo .env.<configuration> correspondiente
     */
    const configuration = this.argvValues[ARGV_NAME_CONFIGURATION] ?? this.argvValues[ARGV_SHORT_NAME_CONFIGURATION];
    const configurationEnvFilePath = join(ROOT_PATH, `.env.${configuration}`);
    if (configuration && existsSync(configurationEnvFilePath)) {
      return configurationEnvFilePath;
    }

    /**
     * * 3. Se comprueba si existe el archivo .env por defecto
     */
    const defaultEnvFilePath = join(ROOT_PATH, '.env');
    if (existsSync(defaultEnvFilePath)) {
      return defaultEnvFilePath;
    }

    return undefined;
  }

  private getEntries(): Record<string, string> {
    /**
     * * 1. Se comprueba si se ha pasado el argumento --system-env
     * Carga los valores directamente del sistema
     */
    const systemEnv = this.argvValues[ARGV_NAME_SYSTEM_ENV];
    if (systemEnv) {
      return process.env as Record<string, string>;
    }

    /**
     * * 2. Se comprueba si existe archivo --env-file, .env o .env.<configuration>
     * Carga de valores desde archivo
     */
    const envFilePath = this.getEnvFilePath();
    if (envFilePath) {
      const configResult = dotenv.config({ path: envFilePath });
      return configResult.parsed ?? {};
    }

    return {};
  }

  /**
   * Llamada de carga de configuration
   */
  public load(state: ConfigurationState): void {
    for (const [key, value] of Object.entries(this.getEntries())) {
      state.setProperty({
        env: key,
        value
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

  private decrypt(value: string, privateKey: ReturnType<typeof createPrivateKey>): string {
    const encryptedData = value.startsWith(CIPHER_PREFIX) ? value.slice(CIPHER_PREFIX.length) : value;
    const decrypted = privateDecrypt(
      { key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
      Buffer.from(encryptedData, 'base64')
    );
    return decrypted.toString('utf8');
  }

  load(state: ConfigurationState): void {
    const encryptKeyPath = state.getProperty(ARGV_NAME_SECURE_KEY);

    if (!encryptKeyPath) {
      return;
    }

    const resolvedKeyPath = resolve(encryptKeyPath);

    if (!existsSync(resolvedKeyPath)) {
      throw new Error(`The specified key file does not exist: ${encryptKeyPath}`);
    }

    const privateKeyPem = readFileSync(resolvedKeyPath, 'utf8');
    const privateKey = createPrivateKey(privateKeyPem);

    if (privateKey.asymmetricKeyType !== 'rsa') {
      throw new Error(`Only RSA private keys are supported for decryption. Found: ${privateKey.asymmetricKeyType}`);
    }

    state.forEach((property) => {
      if (typeof property.value === 'string' && property.value.startsWith(CIPHER_PREFIX)) {
        property.value = this.decrypt(property.value, privateKey);
      }
    });
  }
}
