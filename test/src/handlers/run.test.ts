import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import EventEmitter from 'node:events';
import Module from 'node:module';

import * as fileUtils from '../../../src/utils/file';
import * as bannerService from '../../../src/services/banner';
import { dependencies } from '../../../src/services/dependency';
import { ROOT_PATH } from '../../../src/constants/common';

import {
  DefaultConfigurationLoader,
  EnvConfigurationLoader,
  ArgvConfigurationLoader,
  SecureConfigurationLoader
} from '../../../src/models/ConfigurationLoader';

import type { CommandEvent, Command, Option } from '@alarife/commander';

const MOCK_ENTRY_PATH = resolve(__dirname, '../../mock/run/index.js');

const threadModulePath = require.resolve('@alarife/thread');
const configModulePath = require.resolve('@alarife/configuration');
const handlerModulePath = require.resolve('../../../src/handlers/run');

describe('run handler', () => {
  const fakePackageJson = { name: 'test-app', version: '1.0.0' };

  let getJsonFileMock: ReturnType<typeof mock.fn>;
  let displayBannerMock: ReturnType<typeof mock.fn>;
  let consoleErrorMock: ReturnType<typeof mock.fn>;

  let threadConstructorArgs: any[];
  let mockThreadInstance: EventEmitter;
  let configConstructorArgs: any[];
  let mockStateProperties: { env?: string; argv?: string; shortArgv?: string; value?: any }[];

  let savedThreadCache: any;
  let savedConfigCache: any;

  const createEvent = (mainPath: string, options: Record<string, any> = {}): CommandEvent => ({
    args: [mainPath],
    options
  });

  const createCommandConfig = (options: Option[] = []): Command => ({
    name: 'run',
    options
  });

  const requireRunHandler = (): Function => {
    delete require.cache[handlerModulePath];
    return require('../../../src/handlers/run').default;
  };

  beforeEach(() => {
    getJsonFileMock = mock.method(fileUtils, 'getJsonFile', () => fakePackageJson);
    displayBannerMock = mock.method(bannerService, 'displayBanner', () => {});
    consoleErrorMock = mock.method(console, 'error', () => {});

    dependencies.length = 0;
    threadConstructorArgs = [];
    configConstructorArgs = [];
    mockStateProperties = [];

    class MockThread extends EventEmitter {
      constructor(...args: any[]) {
        super();
        threadConstructorArgs = args;
        mockThreadInstance = this;
      }
    }

    class MockConfiguration {
      constructor(...args: any[]) {
        configConstructorArgs = args;
      }
      load() {
        return {
          export: () => JSON.stringify(mockStateProperties),
          forEach: (cb: (value: any, index: number, array: any[]) => void, thisArg?: any) => mockStateProperties.forEach(cb, thisArg)
        };
      }
    }

    // Save original cache entries and replace with mocks
    savedThreadCache = require.cache[threadModulePath];
    savedConfigCache = require.cache[configModulePath];

    require.cache[threadModulePath] = new Module(threadModulePath);
    require.cache[threadModulePath]!.exports = { Thread: MockThread };

    require.cache[configModulePath] = new Module(configModulePath);
    require.cache[configModulePath]!.exports = { Configuration: MockConfiguration };
  });

  afterEach(() => {
    mock.restoreAll();
    // Restore original cache entries
    require.cache[threadModulePath] = savedThreadCache;
    require.cache[configModulePath] = savedConfigCache;
    delete require.cache[handlerModulePath];
    dependencies.length = 0;
  });

  // Verifica que se lea el package.json desde la ruta raiz del proyecto.
  it('should read the package.json from ROOT_PATH', () => {
    const runHandler = requireRunHandler();
    const event = createEvent(MOCK_ENTRY_PATH);
    const commandConfig = createCommandConfig();

    runHandler(event, {} as any, commandConfig);

    assert.equal(getJsonFileMock.mock.calls.length, 1);
    const calledPath = getJsonFileMock.mock.calls[0].arguments[0];
    assert.equal(calledPath, join(ROOT_PATH, 'package.json'));
  });

  // Verifica que el banner se muestre con el nombre y la version de la app.
  it('should call displayBanner with the package name and version', () => {
    const runHandler = requireRunHandler();
    const event = createEvent(MOCK_ENTRY_PATH);
    const commandConfig = createCommandConfig();

    runHandler(event, {} as any, commandConfig);

    assert.equal(displayBannerMock.mock.calls.length, 1);
    const bannerResume = displayBannerMock.mock.calls[0].arguments[0];
    assert.deepEqual(bannerResume, ['test-app v1.0.0']);
  });

  // Verifica que se incluyan en el banner las dependencias con showVersionInBanner en true.
  it('should include dependencies with showVersionInBanner in the banner resume', () => {
    const runHandler = requireRunHandler();
    dependencies.push({
      name: '@alarife/web',
      version: '2.0.0',
      alarifeConfig: { cli: { commands: [], setup: '', showVersionInBanner: true } }
    });

    const event = createEvent(MOCK_ENTRY_PATH);
    const commandConfig = createCommandConfig();

    runHandler(event, {} as any, commandConfig);

    const bannerResume = displayBannerMock.mock.calls[0].arguments[0];
    assert.deepEqual(bannerResume, ['test-app v1.0.0', '@alarife/web v2.0.0']);
  });

  // Verifica que no se incluyan en el banner dependencias sin showVersionInBanner.
  it('should exclude dependencies without showVersionInBanner from the banner resume', () => {
    const runHandler = requireRunHandler();
    dependencies.push({
      name: '@alarife/data',
      version: '1.5.0',
      alarifeConfig: { cli: { commands: [], setup: '' } }
    });

    const event = createEvent(MOCK_ENTRY_PATH);
    const commandConfig = createCommandConfig();

    runHandler(event, {} as any, commandConfig);

    const bannerResume = displayBannerMock.mock.calls[0].arguments[0];
    assert.deepEqual(bannerResume, ['test-app v1.0.0']);
  });

  // Verifica que no se incluyan dependencias que no tienen configuracion de alarife.
  it('should exclude dependencies without alarifeConfig from the banner resume', () => {
    const runHandler = requireRunHandler();
    dependencies.push({ name: 'some-lib', version: '3.0.0' });

    const event = createEvent(MOCK_ENTRY_PATH);
    const commandConfig = createCommandConfig();

    runHandler(event, {} as any, commandConfig);

    const bannerResume = displayBannerMock.mock.calls[0].arguments[0];
    assert.deepEqual(bannerResume, ['test-app v1.0.0']);
  });

  // Verifica que Configuration se cree con los cuatro loaders y en el orden correcto.
  it('should create Configuration with four loaders in the correct order', () => {
    const runHandler = requireRunHandler();
    const options: Option[] = [{ name: 'port', shortName: 'p', env: 'PORT' }];
    const event = createEvent(MOCK_ENTRY_PATH, { port: '3000' });
    const commandConfig = createCommandConfig(options);

    runHandler(event, {} as any, commandConfig);

    assert.equal(configConstructorArgs.length, 4);
    assert.ok(configConstructorArgs[0] instanceof DefaultConfigurationLoader);
    assert.ok(configConstructorArgs[1] instanceof EnvConfigurationLoader);
    assert.ok(configConstructorArgs[2] instanceof ArgvConfigurationLoader);
    assert.ok(configConstructorArgs[3] instanceof SecureConfigurationLoader);
  });

  // Verifica que el entorno incluya CONFIGURATION_STATE exportado por el estado.
  it('should build environment with CONFIGURATION_STATE from state export', () => {
    const runHandler = requireRunHandler();
    const event = createEvent(MOCK_ENTRY_PATH);
    const commandConfig = createCommandConfig();

    runHandler(event, {} as any, commandConfig);

    const environment = threadConstructorArgs[2];
    assert.equal(environment.CONFIGURATION_STATE, JSON.stringify(mockStateProperties));
  });

  // Verifica que las propiedades con clave env se copien al entorno del Thread.
  it('should add env properties from state to the Thread environment', () => {
    const runHandler = requireRunHandler();
    mockStateProperties.push(
      { env: 'APP_PORT', value: '8080' },
      { env: 'APP_DEBUG', value: 'true' }
    );

    const event = createEvent(MOCK_ENTRY_PATH);
    const commandConfig = createCommandConfig();

    runHandler(event, {} as any, commandConfig);

    const environment = threadConstructorArgs[2];
    assert.equal(environment.APP_PORT, '8080');
    assert.equal(environment.APP_DEBUG, 'true');
  });

  // Verifica que las propiedades sin env no se agreguen al entorno del Thread.
  it('should not add properties without env key to the Thread environment', () => {
    const runHandler = requireRunHandler();
    mockStateProperties.push(
      { argv: 'verbose', value: true },
      { env: 'APP_MODE', value: 'production' }
    );

    const event = createEvent(MOCK_ENTRY_PATH);
    const commandConfig = createCommandConfig();

    runHandler(event, {} as any, commandConfig);

    const environment = threadConstructorArgs[2];
    const envKeys = Object.keys(environment);
    assert.ok(!envKeys.includes('verbose'));
    assert.equal(environment.APP_MODE, 'production');
  });

  // Verifica que Thread se construya con mainPath y opciones vacias.
  it('should create Thread with the provided mainPath and empty options', () => {
    const runHandler = requireRunHandler();
    const event = createEvent(MOCK_ENTRY_PATH);
    const commandConfig = createCommandConfig();

    runHandler(event, {} as any, commandConfig);

    assert.equal(threadConstructorArgs[0], MOCK_ENTRY_PATH);
    assert.deepEqual(threadConstructorArgs[1], {});
  });

  // Verifica que se registre un listener para eventos de error en Thread.
  it('should register an error handler on Thread', () => {
    const runHandler = requireRunHandler();
    const event = createEvent(MOCK_ENTRY_PATH);
    const commandConfig = createCommandConfig();

    runHandler(event, {} as any, commandConfig);

    assert.equal(mockThreadInstance.listenerCount('error'), 1);
  });

  // Verifica que se escriba en consola cuando Thread emite un error.
  it('should log to console.error when Thread emits an error', () => {
    const runHandler = requireRunHandler();
    const event = createEvent(MOCK_ENTRY_PATH);
    const commandConfig = createCommandConfig();

    runHandler(event, {} as any, commandConfig);

    const testError = new Error('child process failed');
    mockThreadInstance.emit('error', testError);

    assert.equal(consoleErrorMock.mock.calls.length, 1);
    assert.equal(consoleErrorMock.mock.calls[0].arguments[0], 'Error in execution: ');
    assert.equal(consoleErrorMock.mock.calls[0].arguments[1], testError);
  });
});
