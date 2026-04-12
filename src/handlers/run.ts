import { Command, CommanderCommand, CommandEvent } from '@alarife/commander';
import { Configuration } from '@alarife/configuration';
import { displayBanner } from '../services/banner';
import { ArgvConfigurationLoader, DefaultConfigurationLoader, EnvConfigurationLoader } from '../models/ConfigurationLoader';

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
  /**
   * TODO: tiene que poderse le enviar informacion adicional al banner antes de mostrarlo
   */
  displayBanner('Welcome to Alarife CLI!');

  // cargar configuración
  const configuration = new Configuration();

  configuration.addLoader(new DefaultConfigurationLoader(commandConfig.options));
  configuration.addLoader(new EnvConfigurationLoader(commandConfig.options, event.options));
  configuration.addLoader(new ArgvConfigurationLoader(commandConfig.options, event.options));

  configuration.load();

  /**
   * TODO: tiene que usar el nuevo repo de threads
   * Tiene que enviar la configuracion de forma segura
   * 
   */
  // configuration.getState().export();
  
};
