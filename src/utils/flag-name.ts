import { Flag, Option } from '../model/Command';

const NAME_CHARACTERS = {
  shortName: '-',
  longName: '--',
  required: {
    start: '<',
    end: '>'
  },
  optional: {
    start: '[',
    end: ']'
  },
  variadic: '...'
};

export const getBaseName = ({ descriptiveType, required, variadic }: Flag) => {
  let name = '';

  if (descriptiveType) {
    let variadicValue: string = variadic ? NAME_CHARACTERS.variadic : '';

    if (required) {
      name += ` ${NAME_CHARACTERS.required.start}${descriptiveType}${variadicValue}${NAME_CHARACTERS.required.end}`;
    } else {
      name += ` ${NAME_CHARACTERS.optional.start}${descriptiveType}${variadicValue}${NAME_CHARACTERS.optional.end}`;
    }
  }

  return name;
};

export const getOptionName = (option: Partial<Option>): string => {
  let name = '';

  if (option.shortName) {
    name += `${NAME_CHARACTERS.shortName}${option.shortName}`;
  }

  if (option.name) {
    if (name) {
      name += ', ';
    }

    name += `${NAME_CHARACTERS.longName}${option.name}`;

    const baseName = getBaseName({
      descriptiveType: option.descriptiveType,
      required: option.required,
      variadic: option.variadic
    });

    name += ` ${baseName}`;
  }

  return name;
};
