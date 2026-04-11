import { Command, CommanderCommand, CommandEvent } from '@alarife/commander';
import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, isAbsolute, extname } from 'path';

const getLicenseText = (author: string, projectName: string, license: string): string => `/*
 * Copyright (c) ${new Date().getFullYear()} ${author}
 *
 * This file is part of ${projectName}.
 *
 * Licensed under the ${license} (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License in the LICENSE file
 * at the root of this project.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
 */`;

const processDirectory = (dirPath: string, extensions: string[], licenseText: string): void => {
  if (dirPath.includes('node_modules') || dirPath.includes('.git')) {
    return;
  }

  const items = readdirSync(dirPath);

  for (const item of items) {
    const itemPath = join(dirPath, item);
    const stats = statSync(itemPath);

    if (stats.isDirectory()) {
      processDirectory(itemPath, extensions, licenseText);
    } else if (stats.isFile() && extensions.includes(extname(itemPath).slice(1))) {
      const currentContent = readFileSync(itemPath, 'utf8');

      if (
        currentContent.includes('Copyright (c)') ||
        currentContent.includes('You may obtain a copy of the License in the LICENSE file')
      ) {
        continue;
      }

      let newContent: string;

      if (currentContent.startsWith('#!/') || currentContent.startsWith('use strict')) {
        const firstLineEnd = currentContent.indexOf('\n');
        const firstLine = firstLineEnd !== -1 ? currentContent.slice(0, firstLineEnd) : currentContent;
        const rest = firstLineEnd !== -1 ? currentContent.slice(firstLineEnd + 1) : '';
        newContent = firstLine + '\n' + licenseText + '\n\n' + rest;
      } else {
        newContent = licenseText + '\n\n' + currentContent;
      }

      writeFileSync(itemPath, newContent, 'utf8');
    }
  }
};

/**
 * command: add-license
 * argument: ./lib (path) (REQUIRED)
 * option: --extensions js ts
 * option: --project-name=@alarife (REQUIRED)
 * option: --project-author="Soria Garcia Jose Eduardo" (REQUIRED)
 * option: --project-license=Apache-2.0 (default: Apache-2.0)
 * 
 * example:
 * add-license ./lib --extensions ts js --project-name=@alarife --project-author="Soria Garcia Jose Eduardo" --project-license=Apache-2.0
 */
export default (event: CommandEvent, command: CommanderCommand, commandConfig: Command) => {
  const [path] = event.args;
  const { extensions, projectName, projectAuthor, projectLicense } = event.options;

  if (!projectAuthor || !projectName) {
    throw new Error('You must specify --project-name and --project-author.');
  }

  const resolvedPath = isAbsolute(path) ? path : join(process.cwd(), path);
  const licenseText = getLicenseText(projectAuthor, projectName, projectLicense);
  const exts: string[] = extensions ?? ['js'];

  processDirectory(resolvedPath, exts, licenseText);
};
