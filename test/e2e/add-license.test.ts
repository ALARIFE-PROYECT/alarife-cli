import assert from 'assert';
import { test } from 'node:test';

import { Command } from '../../src/models/Command';
import { ProgramLineInterface } from '../../src';

test('add-license test', () => {
  /**
   * command: add-license
   * argument: ./lib (path) (REQUIRED)
   * option: --extensions js ts
   * option: --project-name=@alarife (REQUIRED)
   * option: --project-author="Soria Garcia Jose Eduardo" (REQUIRED)
   * option: --project-license=Apache-2.0 (default: Apache-2.0)
   */
  let actionExecuted = false;
  const commandAddLicenseConfig: Command = {
    name: 'add-license',
    description: 'Add license to project',
    action: () => {
      actionExecuted = true;
    },
    arguments: [
      {
        description: 'Path to add license',
        required: true,
        descriptiveType: 'path'
      }
    ],
    options: [
      {
        name: 'extensions',
        description: 'Extensions to add license',
        descriptiveType: 'extensions',
        variadic: true
      },
      {
        name: 'project-name',
        description: 'Project name',
        required: true
      }
    ]
  };

  /**
   * Command:
   * * add-license ./lib --extensions ts js --project-name=@bigbyte/cli --project-author="Soria Garcia Jose Eduardo" --project-license=Apache-2.0
   */
  const argvInput = [
    'add-license',
    './lib',
    '--extensions',
    'js',
    'ts',
    '--project-name=@alarife',
    '--project-author=Soria Garcia Jose Eduardo'
    // '--project-license=Apache-2.0' // Test default value
  ];

  const program = new ProgramLineInterface([commandAddLicenseConfig]);

  /**
   * Test adding options in different moments, before and after adding the command, to test that both ways work correctly
   */
  program.addOption('add-license', {
    name: 'project-author',
    description: 'Project author',
    descriptiveType: 'author',
    required: true
  });

  program.addOption('add-license', {
    name: 'project-license',
    description: 'Project license',
    descriptiveType: 'license',
    defaultValue: 'Apache-2.0'
  });

  const event = program.parse(argvInput);

  assert.strictEqual(event.args[0], './lib', 'Argument should be parsed correctly');
  assert.deepStrictEqual(event.options.extensions, ['js', 'ts'], 'Extensions option should be parsed as an array');
  assert.strictEqual(event.options.projectName, '@alarife', 'Project name should be parsed correctly');
  assert.strictEqual(
    event.options.projectAuthor,
    'Soria Garcia Jose Eduardo',
    'Project author should be parsed correctly'
  );
  assert.strictEqual(
    event.options.projectLicense,
    'Apache-2.0',
    'Project license should have default value if not provided'
  );

  assert.strictEqual(actionExecuted, true, 'Action should be executed');
});
