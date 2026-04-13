import { join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';
import { ProgramLineInterface } from '@alarife/commander';

import { ROOT_PATH } from '../constants/common';

import { getJsonFile } from '../utils/file';

import { AlarifeConfiguration } from '../models/AlarifeConfiguration';

export interface Dependency {
  name: string;
  version: string;
  alarifeConfig?: AlarifeConfiguration;
}

export const dependencies: Dependency[] = [];

const _getFileValue = (path: string): Record<string, any> | undefined => {
  try {
    return getJsonFile(path);
  } catch (error) {
    return undefined;
  }
};

const _addDependency = (path: string, entry: string) => {
  const packageValue = _getFileValue(join(path, entry, 'package.json'));
  const alarifeConfig = _getFileValue(join(path, entry, 'alarife.json'));

  if (alarifeConfig && !packageValue) {
    throw new Error(
      `The package.json file is missing from the ${entry} dependency. Make sure to include the package.json file in the plugin.`
    );
  }

  if (alarifeConfig && packageValue) {
    dependencies.push({
      name: packageValue.name,
      version: packageValue.version,
      alarifeConfig: alarifeConfig as AlarifeConfiguration
    });
  }
};

export const discoverPlugins = () => {
  const path = join(ROOT_PATH, 'node_modules');

  if (!existsSync(path)) {
    throw new Error('The node_modules folder could not be found. Please run "npm install" before running the CLI.');
  }

  const entries = readdirSync(path, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('@')) {
      const scopedPath = join(path, entry.name);
      const scopedEntries = readdirSync(scopedPath, { withFileTypes: true });
      for (const scopedEntry of scopedEntries) {
        if (scopedEntry.isDirectory()) {
          _addDependency(scopedPath, scopedEntry.name);
        }
      }
    } else if (entry.isDirectory()) {
      _addDependency(path, entry.name);
    }
  }
};

export const setupPlugins = (program: ProgramLineInterface) => {
  dependencies.forEach((dependency) => {
    if (dependency.alarifeConfig?.cli?.setup) {
      const setupPath = join(ROOT_PATH, 'node_modules', dependency.name, dependency.alarifeConfig.cli.setup);

      if (!existsSync(setupPath)) {
        throw new Error(
          `The setup script specified in the alarife.json file for the ${dependency.name} dependency could not be found. Make sure to provide a valid path to the setup script.`
        );
      }

      const setupModule = require(setupPath);
      const setupFunction = setupModule.default || setupModule.setup;

      if (typeof setupFunction !== 'function') {
        throw new Error(
          `The setup script specified in the alarife.json file for the ${dependency.name} dependency does not export a default function or a setup function. Make sure to export a valid setup function.`
        );
      }

      setupFunction(program);
    }
  });
};
