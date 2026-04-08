import assert from 'assert';
import { test } from 'node:test';

import { actionExecuted } from '../mock/copy';
import { Command } from '../../src/models/Command';
import { ProgramLineInterface } from '../../src';
import { join } from 'node:path';

test('copy test', () => {
  

  const commandCopyConfig: Command = {
    name: 'copy',
    description: 'Copy files from source to target',
    path: join(__dirname, '../mock/copy.js'),
    arguments: [
      {
        description: 'Path to source file',
        required: true,
        descriptiveType: 'source'
      },
      {
        description: 'Path to target file',
        required: true,
        descriptiveType: 'target'
      }
    ],
    options: [
      {
        name: 'deep',
        description: 'Copy files deeply',
        descriptiveType: 'boolean',
        variadic: false
      }
    ]
  };

  /**
   * Command:
   * * copy ./src ./dist --deep
   */
  const argvInput = ['copy', './src', './dist', '--deep'];

  const program = new ProgramLineInterface([commandCopyConfig]);
  const event = program.parse(argvInput);

  assert.strictEqual(event.args[0], './src', 'Source argument should be parsed correctly');
  assert.strictEqual(event.args[1], './dist', 'Target argument should be parsed correctly');
  assert.strictEqual(event.options.deep, true, 'Deep option should be parsed as true');
  assert.strictEqual(actionExecuted, true, 'Action should be executed');
});
