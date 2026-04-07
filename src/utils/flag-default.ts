import commander, { Argument } from 'commander';
import { DefaultValue, Flag } from '../model/Command';

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
