// import { EventEmitter } from 'node:events';
// import { existsSync, readdirSync } from 'node:fs';
// import { join } from 'node:path';

// import { ROOT_PATH } from '../constants/common';
// import { DEPENDENCIES_RESOLVED_STATE, RESOLVING_TREE_DEPENDENCIES_STATE, TREE_DEPENDENCIES_RESOLVED_STATE } from '../constants/process-status';

// import { Dependency } from '../models/Dependency';
// import { AlarifeConfiguration } from '../models/AlarifeConfiguration';

// import { getJsonFile } from '../utils/file';
// import { commandProcessStatusEmitter } from './command-process-status';

// export const dependencies: Array<Dependency> = [];

/**
 * Generates the dependency tree by reading the node_modules folder and looking for package.json and alarife.json files. Emits events to indicate the progress of the process.
 */
// export const createDependencyTree = (): void => {
//   commandProcessStatusEmitter.emit(RESOLVING_TREE_DEPENDENCIES_STATE);

//   const path = join(ROOT_PATH, 'node_modules');

//   if (!existsSync(path)) {
//     throw new Error('The node_modules folder could not be found. Please run "npm install" before running the CLI.');
//   }

//   const entries = readdirSync(path, { withFileTypes: true });
//   for (const entry of entries) {
//     if (entry.isDirectory()) {
//       const packagePath = join(path, entry.name, 'package.json');
//       const dependencyPackage = getJsonFile(packagePath);

//       const alarifeFilePath = join(path, entry.name, 'alarife.json');

//       let alarifePackage: AlarifeConfiguration | undefined;
//       try {
//         alarifePackage = getJsonFile(alarifeFilePath) as AlarifeConfiguration;
//       } catch (error) {
//         // No alarife.json found, continue without it
//       }

//       dependencies.push({
//         name: dependencyPackage.name,
//         version: dependencyPackage.version,
//         alarifeConfig: alarifePackage,
//         resolve: false
//       });
//     }
//   }

//   commandProcessStatusEmitter.emit(TREE_DEPENDENCIES_RESOLVED_STATE);
// };

/**
 * Checks dependency resolution by its name and updates its status.
 * ! esto marca la dependecia resuelta al setear una opcion o argumento, pero no sabe si ya cargo todas sus dependencias.
 */
// export const resolveDependency = (packageName: string): void => {
//   const dependencyIndex = dependencies.findIndex(dep => dep.name === packageName);

//   if (dependencyIndex === -1) {
//     throw new Error(`Dependency ${packageName} not found in the node_modules folder.`);
//   }

//   const dependency = dependencies[dependencyIndex];

//   /**
//    * Esto obliga a una resolucion de dependencia por adicion de option/agument en el cli. 
//    * Se permite añadir varias option/agument por vez.
//    */
//   if(dependency.resolve === true) {
//     throw new Error(`Dependency ${packageName} is already resolved.`);
//   }

//   dependency.resolve = true;

//   if (dependencies.every(dep => dep.resolve)) {
//     commandProcessStatusEmitter.emit(DEPENDENCIES_RESOLVED_STATE);
//   }
// };
