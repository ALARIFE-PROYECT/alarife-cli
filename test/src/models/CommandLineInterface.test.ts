import assert from 'assert';
import { it, describe } from 'node:test';
import { Command } from '../../../src/models/Command';
import { ProgramLineInterface } from '../../../src';

describe('ProgramLineInterface', () => {
  describe('Argument validation', () => {
    it('Check ProgramLineInterface with argument without descriptiveType', () => {
      const command: Command = {
        name: 'test',
        arguments: [
          //@ts-ignore
          {
            required: true
          }
        ]
      };

      try {
        new ProgramLineInterface([command]);
      } catch (error) {
        assert.strictEqual((error as Error).message, 'Argument must have a descriptiveType');
      }
    });
  });

  describe('Option validation', () => {
    it('Check ProgramLineInterface with descriptiveType but without name or shortName', () => {
      const command: Command = {
        name: 'test',
        options: [
          {
            descriptiveType: 'path',
            required: true
          }
        ]
      };

      try {
        new ProgramLineInterface([command]);
      } catch (error) {
        assert.strictEqual(
          (error as Error).message,
          'Option must have a name or a shortName if it has a descriptiveType'
        );
      }
    });

    it('Check ProgramLineInterface with variadic option without descriptiveType', () => {
      const command: Command = {
        name: 'test',
        options: [
          {
            name: 'files',
            variadic: true,
            required: true
          }
        ]
      };

      try {
        new ProgramLineInterface([command]);
      } catch (error) {
        assert.strictEqual((error as Error).message, 'Option must have a descriptiveType if it is variadic');
      }
    });
  });
});
