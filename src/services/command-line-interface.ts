import { join } from 'node:path';
import { ProgramLineInterface } from '@alarife/commander';

import { RUN_COMMAND } from '../constants/commands';

import { getJsonFile } from '../utils/file';


const COMMANDS = [RUN_COMMAND];
let program: ProgramLineInterface;

export const setupCli = (): ProgramLineInterface => {
  const cliPackageJson = getJsonFile(join(__dirname, '..', '..', 'package.json'));

  program = new ProgramLineInterface(COMMANDS, cliPackageJson.version);

  return program;
};

export const parserCli = () => {
  program.parse(process.argv, 'node');
}
