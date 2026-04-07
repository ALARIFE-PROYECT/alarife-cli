import commander from 'commander';

export const setChoices = (flag: commander.Option | commander.Argument, choices?: string[]) => {
  if (!choices || choices.length === 0) {
    return;
  }

  flag.choices(choices);
};
