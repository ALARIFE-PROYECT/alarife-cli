import { join } from 'node:path';
import { Command, CommanderCommand, CommandEvent } from '@alarife/commander';
import { Configuration } from '@alarife/configuration';
import { Thread } from '@alarife/thread';

import { ROOT_PATH } from '../constants/common';
import { getJsonFile } from '../utils/file';

import {
  ArgvConfigurationLoader,
  DefaultConfigurationLoader,
  EnvConfigurationLoader,
  SecureConfigurationLoader
} from '../models/ConfigurationLoader';

import { displayBanner } from '../services/banner';
import { dependencies } from '../services/dependency';

/**
 * command: run
 * argument: ./dist/index.js (path) (REQUIRED)
 *
 * example:
 * run ./dist/index.js
 */
export default (event: CommandEvent, command: CommanderCommand, commandConfig: Command) => {
  const [mainPath] = event.args;
  const { banner } = event.options;

  if (banner) {
    const clientPackageJson = getJsonFile(join(ROOT_PATH, 'package.json'));
    const bannerResume = [`${clientPackageJson.name} v${clientPackageJson.version}`];

    dependencies.forEach((dependency) => {
      if (dependency.alarifeConfig?.cli?.showVersionInBanner) {
        bannerResume.push(`${dependency.name} v${dependency.version}`);
      }
    });

    displayBanner(bannerResume);
  }

  const configuration = new Configuration(
    new DefaultConfigurationLoader(commandConfig.options),
    new EnvConfigurationLoader(commandConfig.options, event.options),
    new ArgvConfigurationLoader(commandConfig.options, event.configOptions),
    new SecureConfigurationLoader()
  );

  const state = configuration.load();
  const environment: Record<string, any> = {
    CONFIGURATION_STATE: state.export()
  };

  state.forEach((option) => {
    if (option.env) {
      environment[option.env] = option.value;
    }
  });

  const projectThread = new Thread(mainPath, {}, environment);

  projectThread.on('error', (error) => {
    console.error('Error in execution: ', error);
  });
};
