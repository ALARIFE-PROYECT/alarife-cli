import commander from 'commander';
import { Command, Version, Argument, Option } from './Command';
import { getBaseName, getOptionName } from '../utils/flag-name';
import { setDefault } from '../utils/flag-default';
import { setChoices } from '../utils/flag-choices';

export class ProgramLineInterface {
  #program: commander.Command;

  #commands: Array<commander.Command> = [];

  constructor(command?: Command[], version?: Version) {
    this.#program = new commander.Command();

    if (version) {
      this.#serVersion(version, this.#program);
    }

    command?.forEach((cmd) => this.addCommand(cmd));
  }

  /**
   * Añade la configuracion de la version al commander.
   *
   * @param version
   * @param command
   */
  #serVersion(version: Version, command: commander.Command) {
    let name = getOptionName({
      name: version.name,
      shortName: version.shortName
    });

    command.version(version.version, name, version.description);
  }

  /**
   * Busca un comando por su nombre
   *
   * @param commandName
   * @returns Comando
   */
  #findCommand(commandName: string): commander.Command {
    const command = this.#commands.find((cmd) => cmd.name() === commandName);
    if (!command) {
      throw new Error(`Command ${commandName} not found`);
    }
    return command;
  }

  /**
   * Configuracion de un argumento a partir de un objeto Argument
   *
   * @param argument
   */
  #setArgument(argument: Argument, command: commander.Command): void {
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
  }

  /**
   * Configuracion de una opción a partir de un objeto Option
   *
   * @param option
   */
  #setOption(option: Option, command: commander.Command): void {
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
  }

  /**
   * Función que se ejecutará cada vez que se ejecute un comando.
   *
   * @param lineCommand
   * @param options
   * @param commandConfig
   */
  #action(lineCommand: string, options: Record<string, any>, commandConfig: Command): void {
    console.log('Line command: ', lineCommand);
    console.log('Options: ', options);

    if (commandConfig.action) {
      commandConfig.action();
    }

    if (commandConfig.path) {
      console.log(`Path: ${commandConfig.path}`);
    }
  }

  /**
   * Añade un comando a partir de un objeto Command
   * @param command
   */
  public addCommand(command: Command) {
    const commandInstance = new commander.Command(command.name).description(command.description ?? '');

    if (command.version) {
      this.#serVersion(command.version, commandInstance);
    }

    command.arguments?.forEach((a) => this.#setArgument(a, commandInstance));
    command.options?.forEach((o) => this.#setOption(o, commandInstance));

    command.customHelp?.forEach((help) => {
      commandInstance.addHelpText(help.position, help.text);
    });

    commandInstance.action((lineCommand: string, options: Record<string, any>) =>
      this.#action(lineCommand, options, command)
    );

    this.#commands.push(commandInstance);
  }

  public setArgument(commandName: string, argument: Argument) {
    const command = this.#findCommand(commandName);
    this.#setArgument(argument, command);
  }

  public setOption(commandName: string, option: Option) {
    const command = this.#findCommand(commandName);
    this.#setOption(option, command);
  }

  parse(args: string[]) {
    this.#commands.forEach((command) => this.#program.addCommand(command));
    this.#program.parse(args);
  }

  opts(): Record<string, any> {
    return this.#program.opts();
  }
}
