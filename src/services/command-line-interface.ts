import { join } from 'node:path';

import { Argument, Command, CommandEvent, Option, ParserFrom, ProgramLineInterface } from '@alarife/commander';

import { RUN_COMMAND } from '../constants/commands';
import { getJsonFile } from '../utils/file';
// import { resolveDependency } from './dependencies';

const TOOLS = [RUN_COMMAND];

export const cliPackageJson = getJsonFile(join(__dirname, '..', '..', 'package.json'));

class Cli {
  private program: ProgramLineInterface;

  constructor(command?: Command[], version?: string) {
    this.program = new ProgramLineInterface(command, version);
  }

  addCommand(command: Command): void {
    this.program.addCommand(command);
  }

  addArgument(packageName: string, commandName: string, ...argumentList: Argument[]): void {
    this.program.addArgument(commandName, ...argumentList);
    // resolveDependency(packageName);
  }

  addOption(packageName: string, commandName: string, ...optionList: Option[]): void {
    this.program.addOption(commandName, ...optionList);
    // resolveDependency(packageName);
  }

  parse(args: string[], from?: ParserFrom): CommandEvent {
    return this.program.parse(args, from);
  }
}

export const CLI = new Cli(TOOLS, cliPackageJson.version);
