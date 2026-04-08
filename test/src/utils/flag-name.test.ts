import assert from 'assert';
import { test, describe, it } from 'node:test';

import { getBaseName, getOptionName } from '../../../src/utils/flag-name';
import { Flag, Option } from '../../../src/models/Command';

describe('flag-name', () => {
  describe('getBaseName', () => {
    it('Check behavior without descriptiveType', () => {
      const flag: Partial<Flag> = {
        required: true
      };

      const baseName = getBaseName(flag);

      assert.strictEqual(baseName, '');
    });

    it('Check BaseName required', () => {
      const flag: Partial<Flag> = {
        descriptiveType: 'path',
        required: true
      };

      const baseName = getBaseName(flag);

      assert.strictEqual(baseName, '<path>');
    });

    it('Check BaseName optional', () => {
      const flag: Partial<Flag> = {
        descriptiveType: 'path',
        required: false
      };

      const baseName = getBaseName(flag);

      assert.strictEqual(baseName, '[path]');
    });

    it('Check BaseName with variadic', () => {
      const flag: Partial<Flag> = {
        descriptiveType: 'path',
        required: true,
        variadic: true
      };

      const baseName = getBaseName(flag);

      assert.strictEqual(baseName, '<path...>');
    });
  });

  describe('getOptionName', () => {
    it('Check getOptionName with only name', () => {
      const option: Partial<Option> = {
        name: 'extensions'
      };

      const optionName = getOptionName(option);

      assert.strictEqual(optionName, '--extensions');
    });

    it('Check getOptionName with shortName and name', () => {
      const option: Partial<Option> = {
        shortName: 'ex',
        name: 'extensions'
      };

      const optionName = getOptionName(option);

      assert.strictEqual(optionName, '-ex, --extensions');
    });

    it('Check getOptionName with shortName, name and required', () => {
      const option: Partial<Option> = {
        shortName: 'ex',
        name: 'extensions',
        required: true
      };

      const optionName = getOptionName(option);

      assert.strictEqual(optionName, '-ex, --extensions');
    });

    it('Check getOptionName with shortName, name and descriptiveType', () => {
      const option: Partial<Option> = {
        shortName: 'ex',
        name: 'extensions',
        descriptiveType: 'extensions'
      };

      const optionName = getOptionName(option);

      assert.strictEqual(optionName, '-ex, --extensions [extensions]');
    });
  });
});
