import { Command, CommanderCommand, CommandEvent } from '@alarife/commander';
import { Configuration } from '@alarife/configuration';

/**
 * command: run
 * argument: ./dist/index.js (path) (REQUIRED)
 *
 * example:
 * run ./dist/index.js
 */
export default (event: CommandEvent, command: CommanderCommand, commandConfig: Command) => {
  const [] = event.args;
  const {} = event.options;

  // mostrar banner

  // cargar configuración
  const configuration = new Configuration();

  configuration.addLoader();
  configuration.addLoader();
  configuration.addLoader();

  configuration.load();

  // ejecutar nuevo hilo con la configuración
  
};
