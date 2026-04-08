import { Flag, Option } from '../models/Command';

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
  /**
   * Si se especifica un tipo descriptivo
   *
   * descriptiveType: extensions
   * Ejemplo: <extensions> o [extensions] o <extensions...> o [extensions...]
   *
   */
  if (descriptiveType) {
    /**
     * Si es variadic, añade '...' al final del nombre
     *
     * variadic: true
     * Ejemplo: <extensions...> o [extensions...]
     */
    let variadicValue: string = variadic ? NAME_CHARACTERS.variadic : '';

    /**
     * Si es requerido, añade el tipo descriptivo entre los caracteres de requerido, si no, entre los caracteres de opcional
     *
     * required: true
     * Ejemplo: <extensions> o <extensions...>
     *
     * required: false
     * Ejemplo: [extensions] o [extensions...]
     */
    if (required) {
      return `${NAME_CHARACTERS.required.start}${descriptiveType}${variadicValue}${NAME_CHARACTERS.required.end}`;
    } else {
      return `${NAME_CHARACTERS.optional.start}${descriptiveType}${variadicValue}${NAME_CHARACTERS.optional.end}`;
    }
  }

  return '';
};

export const getOptionName = (option: Partial<Option>): string => {
  let name = '';

  /**
   * Añade a la cadena el nombre corto
   *
   * shortName: ex
   * Ejemplo: -ex
   */
  if (option.shortName) {
    name += `${NAME_CHARACTERS.shortName}${option.shortName}`;
  }

  if (option.name) {
    /**
     * si existe un nombre corto, añade una coma y un espacio antes del nombre largo
     * Ejemplo: -ex,
     */
    if (!!name) {
      name += ', ';
    }

    /**
     * Añade a la cadena el nombre largo
     *
     * shortName: ex
     * name: extensions
     * Ejemplo: -ex, --extensions
     */
    name += `${NAME_CHARACTERS.longName}${option.name}`;
  }

  const baseName = getBaseName({
    descriptiveType: option.descriptiveType,
    required: option.required,
    variadic: option.variadic
  });

  /**
   * Si el nombre base no es vacío, añádele un espacio antes de añadirlo a la cadena
   * 
   * Ejemplo: -ex, --extensions [descriptiveType]
   * Ejemplo: --extensions [descriptiveType]
   * Ejemplo: -ex <descriptiveType>
   */
  name += `${!!baseName ? ' ' : ''}${baseName}`;

  return name;
};
