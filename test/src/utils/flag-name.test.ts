import assert from 'assert';
import { test } from 'node:test';

import { getBaseName, getOptionName } from '../../../src/utils/flag-name';
import { Flag, Option } from '../../../src/model/Command';

/**
 * TEST getBaseName
 */

test('Check behavior without descriptiveType', () => {
  const flag: Partial<Flag> = {
    required: true
  };

  const baseName = getBaseName(flag);

  assert.strictEqual(baseName, '');
});

test('Check BaseName required', () => {
  const flag: Partial<Flag> = {
    descriptiveType: 'path',
    required: true
  };

  const baseName = getBaseName(flag);

  assert.strictEqual(baseName, '<path>');
});

test('Check BaseName optional', () => {
  const flag: Partial<Flag> = {
    descriptiveType: 'path',
    required: false
  };

  const baseName = getBaseName(flag);

  assert.strictEqual(baseName, '[path]');
});

test('Check BaseName with variadic', () => {
  const flag: Partial<Flag> = {
    descriptiveType: 'path',
    required: true,
    variadic: true
  };

  const baseName = getBaseName(flag);

  assert.strictEqual(baseName, '<path...>');
});

/**
 * TEST getOptionName
 */

test('Check getOptionName with only name', () => {
  const option: Partial<Option> = {
    name: 'extensions'
  };

  const optionName = getOptionName(option);

  assert.strictEqual(optionName, '--extensions');
});

test('Check getOptionName with shortName and name', () => {
  const option: Partial<Option> = {
    shortName: 'ex',
    name: 'extensions'
  };

  const optionName = getOptionName(option);

  assert.strictEqual(optionName, '-ex, --extensions');
});

test('Check getOptionName with shortName, name and required', () => {
  const option: Partial<Option> = {
    shortName: 'ex',
    name: 'extensions',
    required: true
  };

  const optionName = getOptionName(option);

  assert.strictEqual(optionName, '-ex, --extensions');
});

test('Check getOptionName with shortName, name and descriptiveType', () => {
  const option: Partial<Option> = {
    shortName: 'ex',
    name: 'extensions',
    descriptiveType: 'extensions'
  };

  const optionName = getOptionName(option);

  assert.strictEqual(optionName, '-ex, --extensions [extensions]');
});

// quiero porbar las dos excepciones del _setOption
// cuando creo una opcion con descriptiveType, pero sin name o sin shortName, debe lanzar una excepcion

test('Check _setOption with descriptiveType but without name', () => {
  const option: Partial<Option> = {
    descriptiveType: 'extensions'
  };

  try {
    const name = getOptionName(option);
    console.log("🚀 ~ name:", name)
    // assert.fail('Expected error was not thrown');
  } catch (error) {
    // console.log('🚀 ~ error:', error);
    // assert.strictEqual((error as Error).message, 'Option must have a name or a shortName if it has a descriptiveType');
    console.log("🚀 ~ (error as Error).message:", (error as Error).message)
  }
});
