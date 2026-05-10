import { join } from 'node:path';
import { ProgramLineInterface } from '@alarife/commander';

import { RUN_COMMAND } from '../constants/commands';

import { getJsonFile } from '../utils/file';


const COMMANDS = [RUN_COMMAND];

export const setupCli = (): ProgramLineInterface => {
  const cliPackageJson = getJsonFile(join(__dirname, '..', '..', 'package.json'));

  const program = new ProgramLineInterface(COMMANDS, cliPackageJson.version);

  return program;
};
