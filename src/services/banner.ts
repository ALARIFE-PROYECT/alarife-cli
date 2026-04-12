import { existsSync, readFileSync } from 'fs';
import { DEFAULT_BANNER_PATH, ROOT_PATH } from '../constants/common';

/**
 * * Banner display function
 *
 * - WEB: https://devops.datenkollektiv.de/banner.txt/index.html
 * - FONT: slant | standard
 *
 */
export const displayBanner = (resume: string) => {
  const customBanner = `${ROOT_PATH}/banner.txt`;
  const path = existsSync(customBanner) ? customBanner : DEFAULT_BANNER_PATH;
  const banner = readFileSync(path, { encoding: 'utf8' });

  console.log(banner);
  console.log(resume);

  console.log('\n');
};
