#!/usr/bin/env node
import { ProgramLineInterface } from '@alarife/commander';
import { getPackage } from './utils/package';
import { RUN_COMMAND } from './constants/commands';

const TOOLS = [RUN_COMMAND];

const packageJson = getPackage();
const cli = new ProgramLineInterface(TOOLS, packageJson.version);

cli.parse(process.argv, 'node');
