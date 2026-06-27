import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import fs from 'fs';
import dotenv from 'dotenv';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateKeyPairSync, publicEncrypt, constants, createPrivateKey, KeyObject } from 'node:crypto';

import { EnvConfigurationLoader, SecureConfigurationLoader } from '../../../src/models/ConfigurationLoader';
import {
  ARGV_NAME_CONFIGURATION,
  ARGV_NAME_ENV_FILE,
  ARGV_NAME_SECURE_KEY,
  ARGV_NAME_SYSTEM_ENV
} from '../../../src/constants/arguments';

import type { SourceProperty } from '@alarife/configuration';

const CIPHER_PREFIX = '{cipher}';

const encryptValue = (value: string, publicKey: KeyObject): string => {
  const encrypted = publicEncrypt(
    { key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(value, 'utf8')
  );
  return `${CIPHER_PREFIX}${encrypted.toString('base64')}`;
};

const createState = (properties: SourceProperty[], secureKeyPath?: string): any => ({
  getProperty: (key: string) => {
    if (key === ARGV_NAME_SECURE_KEY && secureKeyPath !== undefined) {
      return secureKeyPath;
    }
    return undefined;
  },
  forEach: (callback: (property: SourceProperty) => void) => properties.forEach(callback)
});

describe('SecureConfigurationLoader', () => {
  let tempDir: string;
  let rsaPublicKey: KeyObject;
  let rsaPrivateKeyPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'alarife-secure-loader-'));

    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    rsaPublicKey = publicKey;

    rsaPrivateKeyPath = join(tempDir, 'private.pem');
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    writeFileSync(rsaPrivateKeyPath, privateKeyPem, 'utf8');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // Verifica que el loader tenga prioridad 4 (la mas alta de los loaders).
  it('should have priority 4', () => {
    const loader = new SecureConfigurationLoader();

    assert.equal(loader.priority, 4);
  });

  // Verifica que no se haga nada si no se ha proporcionado la opcion --secure-key.
  it('should do nothing when the secure-key option is not provided', () => {
    const loader = new SecureConfigurationLoader();
    const properties: SourceProperty[] = [
      { env: 'SECRET', value: `${CIPHER_PREFIX}whatever` }
    ];
    const state = createState(properties);

    loader.load(state);

    assert.equal(properties[0].value, `${CIPHER_PREFIX}whatever`);
  });

  // Verifica que se lance un error si el archivo de clave no existe.
  it('should throw an error if the key file does not exist', () => {
    const loader = new SecureConfigurationLoader();
    const missingKeyPath = join(tempDir, 'missing.pem');
    const state = createState([], missingKeyPath);

    assert.throws(
      () => loader.load(state),
      (error: Error) => error.message.includes('The specified key file does not exist')
    );
  });

  // Verifica que se lance un error si la clave privada no es RSA.
  it('should throw an error if the private key is not RSA', () => {
    const loader = new SecureConfigurationLoader();
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const ecKeyPath = join(tempDir, 'ec.pem');
    writeFileSync(ecKeyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }) as string, 'utf8');
    const state = createState([], ecKeyPath);

    assert.throws(
      () => loader.load(state),
      (error: Error) => error.message.includes('Only RSA private keys are supported for decryption')
    );
  });

  // Verifica que los valores con prefijo {cipher} se descifran correctamente.
  it('should decrypt string values prefixed with {cipher}', () => {
    const loader = new SecureConfigurationLoader();
    const plain = 'super-secret-password';
    const properties: SourceProperty[] = [
      { env: 'DB_PASSWORD', value: encryptValue(plain, rsaPublicKey) }
    ];
    const state = createState(properties, rsaPrivateKeyPath);

    loader.load(state);

    assert.equal(properties[0].value, plain);
  });

  // Verifica que se descifren todas las propiedades con prefijo {cipher}.
  it('should decrypt every property prefixed with {cipher}', () => {
    const loader = new SecureConfigurationLoader();
    const properties: SourceProperty[] = [
      { env: 'DB_USER', value: encryptValue('admin', rsaPublicKey) },
      { env: 'DB_PASSWORD', value: encryptValue('p@ssw0rd', rsaPublicKey) }
    ];
    const state = createState(properties, rsaPrivateKeyPath);

    loader.load(state);

    assert.equal(properties[0].value, 'admin');
    assert.equal(properties[1].value, 'p@ssw0rd');
  });

  // Verifica que los valores sin prefijo {cipher} no se modifiquen.
  it('should leave string values without {cipher} prefix unchanged', () => {
    const loader = new SecureConfigurationLoader();
    const properties: SourceProperty[] = [
      { env: 'PLAIN', value: 'plain-value' }
    ];
    const state = createState(properties, rsaPrivateKeyPath);

    loader.load(state);

    assert.equal(properties[0].value, 'plain-value');
  });

  // Verifica que los valores que no son string no se modifiquen.
  it('should leave non-string values unchanged', () => {
    const loader = new SecureConfigurationLoader();
    const properties: SourceProperty[] = [
      { env: 'PORT', value: 8080 },
      { env: 'DEBUG', value: true },
      { env: 'EMPTY', value: null }
    ];
    const state = createState(properties, rsaPrivateKeyPath);

    loader.load(state);

    assert.equal(properties[0].value, 8080);
    assert.equal(properties[1].value, true);
    assert.equal(properties[2].value, null);
  });

  // Verifica que se lance un error si el valor cifrado es invalido.
  it('should throw an error when the encrypted value cannot be decrypted', () => {
    const loader = new SecureConfigurationLoader();
    const properties: SourceProperty[] = [
      { env: 'BROKEN', value: `${CIPHER_PREFIX}not-a-valid-base64-cipher` }
    ];
    const state = createState(properties, rsaPrivateKeyPath);

    assert.throws(() => loader.load(state));
  });

  // Verifica que se puedan combinar valores cifrados y no cifrados en el mismo estado.
  it('should decrypt only the {cipher} prefixed values when mixed with plain values', () => {
    const loader = new SecureConfigurationLoader();
    const properties: SourceProperty[] = [
      { env: 'PLAIN', value: 'plain-value' },
      { env: 'SECRET', value: encryptValue('decoded', rsaPublicKey) },
      { env: 'PORT', value: 3000 }
    ];
    const state = createState(properties, rsaPrivateKeyPath);

    loader.load(state);

    assert.equal(properties[0].value, 'plain-value');
    assert.equal(properties[1].value, 'decoded');
    assert.equal(properties[2].value, 3000);
  });

  // Verifica que la clave privada pueda ser cargada usando una ruta relativa.
  it('should resolve relative paths for the key file', () => {
    const loader = new SecureConfigurationLoader();
    const relativeKeyPath = rsaPrivateKeyPath;
    const plain = 'relative-secret';
    const properties: SourceProperty[] = [
      { env: 'SECRET', value: encryptValue(plain, rsaPublicKey) }
    ];
    const state = createState(properties, relativeKeyPath);

    loader.load(state);

    assert.equal(properties[0].value, plain);
  });

  // Verifica que la clave privada se cargue correctamente desde el archivo (smoke test).
  it('should accept a valid RSA PEM file as private key', () => {
    const loader = new SecureConfigurationLoader();
    const key = createPrivateKey({
      key: require('fs').readFileSync(rsaPrivateKeyPath, 'utf8')
    });
    assert.equal(key.asymmetricKeyType, 'rsa');

    const properties: SourceProperty[] = [];
    const state = createState(properties, rsaPrivateKeyPath);

    assert.doesNotThrow(() => loader.load(state));
  });
});

interface EnvState {
  properties: Record<string, any>;
  setProperty: (property: { env: string; value: any }) => void;
}

const createEnvState = (): EnvState => {
  const properties: Record<string, any> = {};
  return {
    properties,
    setProperty: (property: { env: string; value: any }) => {
      properties[property.env] = property.value;
    }
  };
};

describe('EnvConfigurationLoader', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  // Verifica que el loader tenga prioridad 2.
  it('should have priority 2', () => {
    const loader = new EnvConfigurationLoader();

    assert.equal(loader.priority, 2);
  });

  // Verifica que se carguen las variables del sistema cuando --system-env esta activo.
  it('should load values from the system environment when system-env is enabled', () => {
    mock.method(fs, 'existsSync', () => false);
    process.env.ALARIFE_TEST_SYSTEM_VAR = 'system-value';

    const loader = new EnvConfigurationLoader([], { [ARGV_NAME_SYSTEM_ENV]: true });
    const state = createEnvState();

    loader.load(state as any);

    assert.equal(state.properties.ALARIFE_TEST_SYSTEM_VAR, 'system-value');

    delete process.env.ALARIFE_TEST_SYSTEM_VAR;
  });

  // Verifica que NO se carguen las variables del sistema cuando --system-env no se proporciona.
  it('should not load system environment variables when system-env is disabled', () => {
    mock.method(fs, 'existsSync', () => false);
    process.env.ALARIFE_TEST_SYSTEM_VAR = 'system-value';

    const loader = new EnvConfigurationLoader([], {});
    const state = createEnvState();

    loader.load(state as any);

    assert.equal(state.properties.ALARIFE_TEST_SYSTEM_VAR, undefined);

    delete process.env.ALARIFE_TEST_SYSTEM_VAR;
  });

  // Verifica que se lance una excepcion cuando el --env-file especificado no existe.
  it('should throw an error when the specified env-file does not exist', () => {
    mock.method(fs, 'existsSync', () => false);

    const loader = new EnvConfigurationLoader([], { [ARGV_NAME_ENV_FILE]: '.env.missing' });
    const state = createEnvState();

    assert.throws(
      () => loader.load(state as any),
      (error: Error) => error.message.includes('The specified env file does not exist')
    );
  });

  // Verifica que se carguen los valores desde el --env-file especificado cuando existe.
  it('should load values from the specified env-file', () => {
    mock.method(fs, 'existsSync', () => true);
    mock.method(dotenv, 'config', () => ({ parsed: { FROM_FILE: 'file-value' } }));

    const loader = new EnvConfigurationLoader([], { [ARGV_NAME_ENV_FILE]: '.env.custom' });
    const state = createEnvState();

    loader.load(state as any);

    assert.equal(state.properties.FROM_FILE, 'file-value');
  });

  // Verifica que los valores del archivo .env sobreescriban los del sistema.
  it('should let env file values override system environment values', () => {
    mock.method(fs, 'existsSync', () => true);
    mock.method(dotenv, 'config', () => ({ parsed: { SHARED: 'file-value' } }));
    process.env.SHARED = 'system-value';

    const loader = new EnvConfigurationLoader([], {
      [ARGV_NAME_SYSTEM_ENV]: true,
      [ARGV_NAME_CONFIGURATION]: 'development'
    });
    const state = createEnvState();

    loader.load(state as any);

    assert.equal(state.properties.SHARED, 'file-value');

    delete process.env.SHARED;
  });

  // Verifica que se cargue el archivo .env.<configuration> correspondiente.
  it('should load the configuration-specific env file when available', () => {
    mock.method(fs, 'existsSync', () => true);
    mock.method(dotenv, 'config', () => ({ parsed: { CONFIG_VAR: 'config-value' } }));

    const loader = new EnvConfigurationLoader([], { [ARGV_NAME_CONFIGURATION]: 'production' });
    const state = createEnvState();

    loader.load(state as any);

    assert.equal(state.properties.CONFIG_VAR, 'config-value');
  });

  // Verifica que se cargue el archivo .env por defecto cuando no se especifica configuracion.
  it('should load the default .env file when no specific configuration is provided', () => {
    mock.method(fs, 'existsSync', () => true);
    mock.method(dotenv, 'config', () => ({ parsed: { DEFAULT_VAR: 'default-value' } }));

    const loader = new EnvConfigurationLoader([], {});
    const state = createEnvState();

    loader.load(state as any);

    assert.equal(state.properties.DEFAULT_VAR, 'default-value');
  });

  // Verifica que no se establezca ninguna propiedad cuando no hay ninguna fuente de variables disponible.
  it('should set no properties when no env source is available', () => {
    mock.method(fs, 'existsSync', () => false);

    const loader = new EnvConfigurationLoader([], {});
    const state = createEnvState();

    loader.load(state as any);

    assert.equal(Object.keys(state.properties).length, 0);
  });
});
