import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import { DEFAULT_BANNER_PATH, ROOT_PATH } from '../../../src/constants/common';
import { displayBanner } from '../../../src/services/banner';

describe('displayBanner', () => {
  const bannerContent = 'FAKE BANNER';
  let existsSyncMock: ReturnType<typeof mock.fn>;
  let readFileSyncMock: ReturnType<typeof mock.fn>;
  let consoleLogMock: ReturnType<typeof mock.fn>;

  beforeEach(() => {
    existsSyncMock = mock.method(fs, 'existsSync', () => false);
    readFileSyncMock = mock.method(fs, 'readFileSync', () => bannerContent);
    consoleLogMock = mock.method(console, 'log', () => {});
  });

  afterEach(() => {
    mock.restoreAll();
  });

  // Verifica que se use la ruta del banner por defecto cuando no existe un banner personalizado
  it('should use the default banner path when custom banner does not exist', () => {
    existsSyncMock.mock.mockImplementation(() => false);

    displayBanner([]);

    const existsCall = existsSyncMock.mock.calls[0];
    assert.equal(existsCall.arguments[0], `${ROOT_PATH}/banner.txt`);

    const readCall = readFileSyncMock.mock.calls[0];
    assert.equal(readCall.arguments[0], DEFAULT_BANNER_PATH);
    assert.deepEqual(readCall.arguments[1], { encoding: 'utf8' });
  });

  // Verifica que se use la ruta del banner personalizado cuando este existe en el directorio raíz
  it('should use the custom banner path when custom banner exists', () => {
    existsSyncMock.mock.mockImplementation(() => true);

    displayBanner([]);

    const readCall = readFileSyncMock.mock.calls[0];
    assert.equal(readCall.arguments[0], `${ROOT_PATH}/banner.txt`);
  });

  // Verifica que el contenido del banner sea impreso en consola
  it('should print the banner content', () => {
    displayBanner([]);

    const firstLogCall = consoleLogMock.mock.calls[0];
    assert.equal(firstLogCall.arguments[0], bannerContent);
  });

  // Verifica que cada línea del resumen sea impresa individualmente en consola
  it('should print each resume line', () => {
    const resume = ['Line 1', 'Line 2', 'Line 3'];

    displayBanner(resume);

    // calls: banner, line1, line2, line3, newline
    assert.equal(consoleLogMock.mock.callCount(), 5);
    assert.equal(consoleLogMock.mock.calls[1].arguments[0], 'Line 1');
    assert.equal(consoleLogMock.mock.calls[2].arguments[0], 'Line 2');
    assert.equal(consoleLogMock.mock.calls[3].arguments[0], 'Line 3');
  });

  // Verifica que se imprima un salto de línea al final de la ejecución
  it('should print a trailing newline', () => {
    displayBanner([]);

    const lastCall = consoleLogMock.mock.calls[consoleLogMock.mock.callCount() - 1];
    assert.equal(lastCall.arguments[0], '\n');
  });

  // Verifica que la función maneje correctamente un arreglo de resumen vacío
  it('should handle an empty resume array', () => {
    displayBanner([]);

    // calls: banner, newline
    assert.equal(consoleLogMock.mock.callCount(), 2);
  });
});
