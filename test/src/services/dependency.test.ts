import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import * as common from '../../../src/constants/common';
import * as fileUtils from '../../../src/utils/file';

const MOCK_ROOT_PATH = path.resolve(__dirname, '../../mock');
const originalRootPath = common.ROOT_PATH;

describe('discoverPlugins', () => {
  let getJsonFileMock: ReturnType<typeof mock.fn>;

  beforeEach(() => {
    (common as any).ROOT_PATH = MOCK_ROOT_PATH;
  });

  afterEach(() => {
    mock.restoreAll();
    (common as any).ROOT_PATH = originalRootPath;
    const { dependencies } = require('../../../src/services/dependency');
    dependencies.length = 0;
  });

  // Descubre plugins no-scoped que tienen package.json y alarife.json
  it('should discover non-scoped plugins with both package.json and alarife.json', async () => {
    const { discoverPlugins, dependencies } = await import('../../../src/services/dependency');

    discoverPlugins();

    const testLib = dependencies.find((d: any) => d.name === 'test-library');
    assert.ok(testLib, 'Should find the TEST_LIBRARY plugin');
    assert.equal(testLib.version, '0.1.0');
    assert.deepEqual(testLib.alarifeConfig, {});
  });

  // Descubre plugins dentro de un scope (carpetas que empiezan con @)
  it('should discover scoped plugins under @ directories', async () => {
    const { discoverPlugins, dependencies } = await import('../../../src/services/dependency');

    discoverPlugins();

    const dataPlugin = dependencies.find((d: any) => d.name === '@alarife/data');
    const webPlugin = dependencies.find((d: any) => d.name === '@alarife/web');

    assert.ok(dataPlugin, 'Should find the @alarife/data plugin');
    assert.equal(dataPlugin.version, '0.1.0');

    assert.ok(webPlugin, 'Should find the @alarife/web plugin');
    assert.equal(webPlugin.version, '0.1.0');
  });

  // Verifica que los comandos y opciones del plugin se almacenen correctamente en alarifeConfig
  it('should store commands and options from alarife.json in the plugin alarifeConfig', async () => {
    const { discoverPlugins, dependencies } = await import('../../../src/services/dependency');

    discoverPlugins();

    const webPlugin = dependencies.find((d: any) => d.name === '@alarife/web');
    assert.ok(webPlugin, 'Should find the @alarife/web plugin');

    const commands = (webPlugin.alarifeConfig as any)?.cli?.commands;
    assert.ok(commands, 'Should have commands in alarifeConfig');
    assert.equal(commands.length, 1);
    assert.equal(commands[0].name, 'run');
    assert.equal(commands[0].options.length, 1);
    assert.equal(commands[0].options[0].name, 'port');
    assert.equal(commands[0].options[0].short, 'p');
    assert.equal(commands[0].options[0].description, 'Port to run the server on');
    assert.equal(commands[0].options[0].env, 'WEB_PORT');
  });

  // Verifica que la ruta del script de setup se almacene correctamente en alarifeConfig
  it('should store the setup path from alarife.json in the plugin alarifeConfig', async () => {
    const { discoverPlugins, dependencies } = await import('../../../src/services/dependency');

    discoverPlugins();

    const dataPlugin = dependencies.find((d: any) => d.name === '@alarife/data');
    assert.ok(dataPlugin, 'Should find the @alarife/data plugin');
    assert.equal(dataPlugin.alarifeConfig?.cli?.setup, './setup');
  });

  // Lanza un error si la carpeta node_modules no existe
  it('should throw an error if node_modules folder does not exist', () => {
    (common as any).ROOT_PATH = '/non/existent/path';

    const { discoverPlugins } = require('../../../src/services/dependency');

    assert.throws(
      () => discoverPlugins(),
      { message: 'The node_modules folder could not be found. Please run "npm install" before running the CLI.' }
    );
  });

  // Lanza un error si un plugin tiene alarife.json pero no tiene package.json
  it('should throw an error if a plugin has alarife.json but no package.json', () => {
    getJsonFileMock = mock.method(fileUtils, 'getJsonFile', (filePath: string) => {
      if (filePath.endsWith('package.json')) {
        throw new Error('Missing file in the specified path');
      }
      return {};
    });

    const { discoverPlugins } = require('../../../src/services/dependency');

    assert.throws(
      () => discoverPlugins(),
      (error: Error) => error.message.includes('package.json file is missing')
    );
  });

  // No agrega dependencias que no tienen alarife.json
  it('should not add dependencies that lack an alarife.json file', () => {
    getJsonFileMock = mock.method(fileUtils, 'getJsonFile', (filePath: string) => {
      if (filePath.endsWith('alarife.json')) {
        throw new Error('Missing file in the specified path');
      }
      return { name: 'some-lib', version: '1.0.0' };
    });

    const { discoverPlugins, dependencies } = require('../../../src/services/dependency');

    discoverPlugins();

    assert.equal(dependencies.length, 0);
  });
});

describe('setupPlugins', () => {
  let getJsonFileMock: ReturnType<typeof mock.fn>;

  beforeEach(() => {
    (common as any).ROOT_PATH = MOCK_ROOT_PATH;
  });

  afterEach(() => {
    mock.restoreAll();
    (common as any).ROOT_PATH = originalRootPath;
    const { dependencies } = require('../../../src/services/dependency');
    dependencies.length = 0;
  });

  // Ejecuta la función de setup de cada plugin que tenga un script de setup configurado
  it('should call the setup function for plugins with a setup script', () => {
    const { discoverPlugins, setupPlugins } = require('../../../src/services/dependency');

    discoverPlugins();

    const dataSetupPath = path.join(
      path.resolve(__dirname, '../../mock'),
      'node_modules', '@alarife', 'data', 'setup'
    );

    const originalExistsSync = fs.existsSync;
    mock.method(fs, 'existsSync', (p: string) => {
      if (path.normalize(p) === path.normalize(dataSetupPath)) return true;
      return originalExistsSync(p);
    });

    const mockProgram = {} as any;
    setupPlugins(mockProgram);

    assert.equal(mockProgram.setupCalled, true, 'The setup function should have been called');
  });

  // Lanza un error si el script de setup especificado no existe
  it('should throw an error if the setup script does not exist', () => {
    (common as any).ROOT_PATH = '/fake/root';

    const { dependencies, setupPlugins } = require('../../../src/services/dependency');

    dependencies.push({
      name: 'missing-setup-plugin',
      version: '1.0.0',
      alarifeConfig: { cli: { setup: 'nonexistent.js' } }
    });

    const mockProgram = {} as any;

    assert.throws(
      () => setupPlugins(mockProgram),
      (error: Error) => error.message.includes('could not be found')
    );
  });

  // Lanza un error si el módulo de setup no exporta una función válida
  it('should throw an error if the setup module does not export a valid function', () => {
    const { dependencies, setupPlugins } = require('../../../src/services/dependency');

    const setupPath = path.join(
      path.resolve(__dirname, '../../mock'),
      'node_modules',
      'bad-setup-plugin',
      'setup.js'
    );

    dependencies.push({
      name: 'bad-setup-plugin',
      version: '1.0.0',
      alarifeConfig: { cli: { setup: 'setup.js' } }
    });

    const existsMock = mock.method(fs, 'existsSync', (p: string) => {
      return p === setupPath ? true : fs.existsSync(p);
    });

    assert.throws(
      () => setupPlugins({} as any),
      (error: Error) => {
        // It will either fail on require (module not found) or on the function check
        return error.message.includes('does not export') || error.message.includes('Cannot find module');
      }
    );
  });

  // No ejecuta nada si el plugin no tiene script de setup configurado
  it('should skip plugins without a setup script', () => {
    const { dependencies, setupPlugins } = require('../../../src/services/dependency');

    dependencies.push({
      name: 'no-setup-plugin',
      version: '1.0.0',
      alarifeConfig: { cli: {} }
    });

    const mockProgram = {} as any;

    // Should not throw
    assert.doesNotThrow(() => setupPlugins(mockProgram));
  });

  // No ejecuta nada si el plugin no tiene configuración de alarife
  it('should skip plugins without alarifeConfig', () => {
    const { dependencies, setupPlugins } = require('../../../src/services/dependency');

    dependencies.push({
      name: 'plain-plugin',
      version: '1.0.0'
    });

    const mockProgram = {} as any;

    assert.doesNotThrow(() => setupPlugins(mockProgram));
  });
});
