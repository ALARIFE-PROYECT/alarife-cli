#!/usr/bin/env node
import { createDependencyTree } from './services/dependencies';
import { commandProcessStatusEmitter } from './services/command-process-status';
import { COMMAND_EXECUTED_STATE, DEPENDENCIES_RESOLVED_STATE, EXECUTING_COMMAND_STATE, INIT_STATE } from './constants/process-status';
import { CLI } from './services/command-line-interface';


commandProcessStatusEmitter.emit(INIT_STATE);

createDependencyTree();

commandProcessStatusEmitter.on(DEPENDENCIES_RESOLVED_STATE, () => {
  commandProcessStatusEmitter.emit(EXECUTING_COMMAND_STATE);

  CLI.parse(process.argv, 'node');

  commandProcessStatusEmitter.emit(COMMAND_EXECUTED_STATE);
});
