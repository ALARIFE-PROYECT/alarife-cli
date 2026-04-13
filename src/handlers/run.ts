import { join } from 'node:path';
import { Command, CommanderCommand, CommandEvent } from '@alarife/commander';
import { Configuration } from '@alarife/configuration';

import { ROOT_PATH } from '../constants/common';
import { getJsonFile } from '../utils/file';

import {
  ArgvConfigurationLoader,
  DefaultConfigurationLoader,
  EnvConfigurationLoader
} from '../models/ConfigurationLoader';

import { displayBanner } from '../services/banner';
import { dependencies } from '../services/dependencies';


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

  const clientPackageJson = getJsonFile(join(ROOT_PATH, 'package.json'));
  const bannerResume = [`${clientPackageJson.name} v${clientPackageJson.version}`];

  dependencies.forEach((dependency) => {
    if (dependency.alarifeConfig?.cli?.showVersionInBanner) {
      bannerResume.push(`${dependency.name} v${dependency.version}`);
    }
  });

  displayBanner(bannerResume);

  const configuration = new Configuration(
    new DefaultConfigurationLoader(commandConfig.options),
    new EnvConfigurationLoader(commandConfig.options, event.options),
    new ArgvConfigurationLoader(commandConfig.options, event.options)
  );
  configuration.load();

  /**
   * TODO: tiene que usar el nuevo repo de threads
   * Tiene que enviar la configuracion de forma segura
   *
   */
  // configuration.getState().export();
};
