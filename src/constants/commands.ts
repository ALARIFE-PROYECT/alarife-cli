import { Command } from '@alarife/commander';
import { join } from 'path';

import {
  ARGV_NAME_CONFIGURATION,
  ARGV_NAME_DEBUG,
  ARGV_NAME_ENV_FILE,
  ARGV_NAME_NO_BANNER,
  ARGV_NAME_SECURE_KEY,
  ARGV_NAME_SYSTEM_ENV,
  ARGV_SHORT_NAME_CONFIGURATION,
  ARGV_SHORT_NAME_DEBUG
} from './arguments';
import { DEVELOPMENT, ENV_DEBUG_MODE, NODE_ENV, PRODUCTION, TEST } from './environment';

export const RUN_COMMAND: Command = {
  name: 'run',
  description: 'Run the specified command.',
  path: join(__dirname, '../handlers/run.js'),
  arguments: [
    {
      description: 'Path to add license',
      required: true,
      descriptiveType: 'path'
    }
  ],
  options: [
    {
      name: ARGV_NAME_CONFIGURATION,
      shortName: ARGV_SHORT_NAME_CONFIGURATION,
      description: 'Specify the configuration environment to use (e.g., development, production, test).',
      descriptiveType: 'environment',
      choices: [DEVELOPMENT, PRODUCTION, TEST],
      defaultValue: DEVELOPMENT,
      env: NODE_ENV
    },
    {
      name: ARGV_NAME_DEBUG,
      shortName: ARGV_SHORT_NAME_DEBUG,
      description: 'Enable debug mode for more verbose output.',
      descriptiveType: 'boolean',
      defaultValue: false,
      env: ENV_DEBUG_MODE
    },
    {
      name: ARGV_NAME_ENV_FILE,
      description: 'Specify a custom .env file to load environment variables from.',
      descriptiveType: 'path',
      conflicts: [ARGV_NAME_SYSTEM_ENV]
    },
    {
      name: ARGV_NAME_SYSTEM_ENV,
      description: 'Load environment variables directly from the system environment.',
      descriptiveType: 'boolean',
      defaultValue: false,
      conflicts: [ARGV_NAME_ENV_FILE]
    },
    {
      name: ARGV_NAME_NO_BANNER,
      description: 'Disable the display of the banner.',
      descriptiveType: 'boolean'
    },
    {
      name: ARGV_NAME_SECURE_KEY,
      description: 'Provide a secure key to decrypt sensitive configuration values.',
      descriptiveType: 'string'
    }
  ]
};
