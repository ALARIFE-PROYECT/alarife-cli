import { existsSync, readFileSync } from 'node:fs';


export const getJsonFile = (path: string): Record<string, any> => {
  if (!existsSync(path)) {
    throw new Error('Missing file in the specified path');
  }

  const fileContent = readFileSync(path, 'utf-8');

  let content;
  try {
    content = JSON.parse(fileContent);
  } catch (error) {
    throw new Error('Invalid JSON format in the specified file');
  }

  return content;
};
