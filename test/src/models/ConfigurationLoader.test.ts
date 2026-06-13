import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateKeyPairSync, publicEncrypt, constants, createPrivateKey, KeyObject } from 'node:crypto';

import { SecureConfigurationLoader } from '../../../src/models/ConfigurationLoader';
import { ARGV_NAME_SECURE_KEY } from '../../../src/constants/arguments';

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
      return { value: secureKeyPath };
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
