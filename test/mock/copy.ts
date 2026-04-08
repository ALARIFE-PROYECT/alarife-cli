import commander from 'commander';
import { Command } from '../../src/models/Command';
import { CommandEvent } from '../../src/models/CommandParser';

export let actionExecuted = false;
export default (event: CommandEvent, command: commander.Command, commandConfig: Command) => {
    console.log('Copy function executed');
    actionExecuted = true;
};
