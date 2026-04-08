import commander from 'commander';

import { Argument, Command, Option } from './model/Command';
import { getBaseName, getOptionName } from './utils/flag-name';
import { setDefault } from './utils/flag-default';
import { setChoices } from './utils/flag-choices';

const program = new commander.Command();
const commands: Array<commander.Command> = [];

const action = (lineCommand: string, options: Record<string, any>, commandConfig: Command) => {
  console.log('Line command: ', lineCommand);
  console.log('Options: ', options);

  if (commandConfig.action) {
    commandConfig.action();
  }

  if (commandConfig.path) {
    console.log(`Path: ${commandConfig.path}`);
  }
};

/**
 * Añade un comando a partir de un objeto Command
 * @param command
 */
export const addCommand = (command: Command): void => {
  const commandInstance = new commander.Command(command.name).description(command.description ?? '');

  if (command.version) {
    let name = getOptionName({
      name: command.version.name,
      shortName: command.version.shortName
    });

    commandInstance.version(command.version.version, name, command.version.description);
  }

  command.arguments?.forEach((a) => _setArgument(a, commandInstance));
  command.options?.forEach((o) => _setOption(o, commandInstance));

  command.customHelp?.forEach((help) => {
    commandInstance.addHelpText(help.position, help.text);
  });

  commandInstance.action((lineCommand: string, options: Record<string, any>) => action(lineCommand, options, command));

  commands.push(commandInstance);
};

/**
 * Configuracion de un argumento a partir de un objeto Argument
 *
 * @param argument
 */
const _setArgument = (argument: Argument, command: commander.Command): void => {
  if (!argument.descriptiveType) {
    throw new Error('Argument must have a descriptiveType');
  }

  let name = getBaseName({
    descriptiveType: argument.descriptiveType,
    required: argument.required,
    variadic: argument.variadic
  });

  const newArgument = new commander.Argument(name, argument.description);

  if (argument.required) {
    newArgument.argRequired();
  } else {
    newArgument.argOptional();
  }

  setDefault(newArgument, argument.defaultValue);
  setChoices(newArgument, argument.choices);
  // .env('ENV_VAR_NAME') // TODO: implement env variable support for arguments

  command.addArgument(newArgument);
};

/**
 * Configuracion de una opción a partir de un objeto Option
 *
 * @param option
 */
const _setOption = (option: Option, command: commander.Command): void => {
  /**
   * Si la opción tiene un descriptiveType, debe tener un nombre o un nombre corto para poder generar el nombre correctamente
   *
   * name: extensions
   * descriptiveType: ExtensionsList
   * Ejemplo: --extensions [ExtensionsList]
   * Ejemplo: -ex, --extensions [ExtensionsList]
   * Ejemplo: -ex [ExtensionsList]
   */
  if (option.descriptiveType && !option.name && !option.shortName) {
    throw new Error('Option must have a name or a shortName if it has a descriptiveType');
  }

  /**
   * Si la opción es variadic, debe tener un descriptiveType para poder generar el nombre correctamente
   *
   * name: extensions
   * variadic: true
   * descriptiveType: extensions
   * Ejemplo: --extensions [extensions...]
   */
  if (!option.descriptiveType && option.variadic) {
    throw new Error('Option must have a descriptiveType if it is variadic');
  }

  let name = getOptionName(option);

  const newOption = new commander.Option(name, option.description);
  newOption.required = option.required ?? false;

  if (option.hideHelp) {
    newOption.hideHelp();
  }

  if (option.preset !== undefined) {
    newOption.preset(option.preset);
  }

  if (option.conflicts) {
    newOption.conflicts(option.conflicts);
  }

  if (option.implies) {
    newOption.implies(option.implies);
  }

  setDefault(newOption, option.defaultValue);
  setChoices(newOption, option.choices);
  // .env('ENV_VAR_NAME') // TODO: implement env variable support for options

  command.addOption(newOption);
};

/**
 * Busca un comando por su nombre
 *
 * @param commandName
 * @returns Comando
 */
const _findCommand = (commandName: string): commander.Command => {
  const command = commands.find((cmd) => cmd.name() === commandName);
  if (!command) {
    throw new Error(`Command ${commandName} not found`);
  }
  return command;
};

export const setArgument = () => (commandName: string, argument: Argument) => {
  const command = _findCommand(commandName);
  _setArgument(argument, command);
};

export const setOption = () => (commandName: string, option: Option) => {
  const command = _findCommand(commandName);
  _setOption(option, command);
};

export const parse = (args: string[]) => {
  commands.forEach((command) => program.addCommand(command));
  program.parse(args);
};

export const opts = (): Record<string, any> => {
  return program.opts();
};
