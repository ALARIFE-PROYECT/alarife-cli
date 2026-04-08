import commander from 'commander';
import { DefaultValue } from '../models/Command';

export const setDefault = (flag: commander.Option | commander.Argument, defaultValue?: DefaultValue) => {
  if (defaultValue === undefined) {
    return;
  }

  if (typeof defaultValue === 'object') {
    flag.default(defaultValue.value, defaultValue.description);
  } else {
    flag.default(defaultValue);
  }
};
