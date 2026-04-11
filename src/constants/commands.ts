import { Command } from '@alarife/commander';
import { join } from 'path';

/**
 * ! Requier repo uitls ==> Alamacenar los nombre de las env y argv en el repo de utils para la reutilizacion de contastes comunes del proyecto alarife
 */
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
      name: **,
      shortName: **,
      description: 'Specify the environment to run the command in.',
      descriptiveType: 'environment',
      choices: ['development', 'production', 'test'],
      defaultValue: 'development',
      env: 'NODE_ENV'
    },
    {
      shortName: 'd',
      description: 'Enable debug mode for more verbose output.',
      descriptiveType: 'boolean',
      defaultValue: false,
      env: **
    }
  ]
};
