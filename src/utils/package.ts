import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const getPackage = (): Record<string, any> => {
  const packageJson = join(__dirname, '..', '..', 'package.json');

  if (!existsSync(packageJson)) {
    throw new Error('Missing package.json file in the root directory');
  }

  const fileContent = readFileSync(packageJson, 'utf-8');

  let content;
  try {
    content = JSON.parse(fileContent);
  } catch (error) {
    throw new Error('Invalid JSON format in package.json file');
  }

  return content;
};
