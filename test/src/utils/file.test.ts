import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import { getJsonFile } from '../../../src/utils/file';

describe('getJsonFile', () => {
  const fakePath = '/fake/path/file.json';
  const validJson = { key: 'value', number: 42 };
  let existsSyncMock: ReturnType<typeof mock.fn>;
  let readFileSyncMock: ReturnType<typeof mock.fn>;

  beforeEach(() => {
    existsSyncMock = mock.method(fs, 'existsSync', () => true);
    readFileSyncMock = mock.method(fs, 'readFileSync', () => JSON.stringify(validJson));
  });

  afterEach(() => {
    mock.restoreAll();
  });

  // Verifica que se lance un error cuando el archivo no existe en la ruta especificada
  it('should throw an error when the file does not exist', () => {
    existsSyncMock.mock.mockImplementation(() => false);

    assert.throws(() => getJsonFile(fakePath), {
      message: 'Missing file in the specified path',
    });
  });

  // Verifica que se llame a existsSync con la ruta proporcionada
  it('should check if the file exists with the given path', () => {
    getJsonFile(fakePath);

    const existsCall = existsSyncMock.mock.calls[0];
    assert.equal(existsCall.arguments[0], fakePath);
  });

  // Verifica que se lea el archivo con la codificación utf-8
  it('should read the file with utf-8 encoding', () => {
    getJsonFile(fakePath);

    const readCall = readFileSyncMock.mock.calls[0];
    assert.equal(readCall.arguments[0], fakePath);
    assert.equal(readCall.arguments[1], 'utf-8');
  });

  // Verifica que se retorne el contenido JSON parseado correctamente
  it('should return the parsed JSON content', () => {
    const result = getJsonFile(fakePath);

    assert.deepEqual(result, validJson);
  });

  // Verifica que se lance un error cuando el archivo contiene JSON inválido
  it('should throw an error when the file contains invalid JSON', () => {
    readFileSyncMock.mock.mockImplementation(() => 'not valid json');

    assert.throws(() => getJsonFile(fakePath), {
      message: 'Invalid JSON format in the specified file',
    });
  });

  // Verifica que se maneje correctamente un objeto JSON vacío
  it('should handle an empty JSON object', () => {
    readFileSyncMock.mock.mockImplementation(() => '{}');

    const result = getJsonFile(fakePath);

    assert.deepEqual(result, {});
  });
});
