import commander from 'commander';
import { Command, Version, Argument, Option } from './Command';
import { getBaseName, getOptionName } from '../utils/flag-name';
import { setDefault } from '../utils/flag-default';
import { setChoices } from '../utils/flag-choices';
import { basename, resolve } from 'node:path';
import { CommandEvent, ParserFrom } from './CommandParser';

export class ProgramLineInterface {
  #program: commander.Command;

  #commands: Array<commander.Command> = [];

  #lastEvent: CommandEvent | undefined;

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
    if (typeof version === 'string') {
      command.version(version);
    } else if (typeof version === 'object') {
      let name = getOptionName({
        name: version.name,
        shortName: version.shortName
      });

      command.version(version.version, name, version.description);
    } else {
      throw new Error('Invalid version format');
    }
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
  #addArgument(argument: Argument, command: commander.Command): void {
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
  #addOption(option: Option, command: commander.Command): void {
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
   * lineCommand: string, options: Record<string, any>, commandConfig: Command
   */
  #action(args: any[], options: Record<string, any>, command: commander.Command, commandConfig: Command): void {
    const event: CommandEvent = {
      args: args,
      options: options
    };

    this.#lastEvent = event;

    if (commandConfig.action) {
      commandConfig.action(event, command, commandConfig);
    }

    if (commandConfig.path) {
      const path = commandConfig.path;

      const actionPathFile = basename(path);
      if (!actionPathFile || !actionPathFile.endsWith('.js')) {
        throw new Error('Invalid action path. The file must be a JavaScript file.');
      }

      const actionModule = require(resolve(path));

      if (
        (!actionModule?.default && typeof actionModule.default === 'function') ||
        (!actionModule?.handler && typeof actionModule.handler === 'function')
      ) {
        throw new Error('Invalid action module. The module must export a default function or a handler function.');
      }

      actionModule?.default?.(event, command, commandConfig);
      actionModule?.handler?.(event, command, commandConfig);
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

    command.arguments?.forEach((a) => this.#addArgument(a, commandInstance));
    command.options?.forEach((o) => this.#addOption(o, commandInstance));

    command.customHelp?.forEach((help) => {
      commandInstance.addHelpText(help.position, help.text);
    });

    commandInstance.action((...args: any[]) => {
      const cmd: commander.Command = args.pop();
      const options = args.pop();

      this.#action(args, options, cmd, command);
    });

    this.#commands.push(commandInstance);
  }

  public addArgument(commandName: string, argument: Argument) {
    const command = this.#findCommand(commandName);
    this.#addArgument(argument, command);
  }

  public addOption(commandName: string, option: Option) {
    const command = this.#findCommand(commandName);
    this.#addOption(option, command);
  }

  parse(args: string[], from: ParserFrom = 'user'): CommandEvent {
    this.#commands.forEach((command) => this.#program.addCommand(command));
    this.#program.parse(args, { from: from });

    return this.#lastEvent ?? { args: [], options: {} };
  }
}
