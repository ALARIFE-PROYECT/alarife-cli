import commander from 'commander';
import { CommandEvent } from './CommandParser';

export interface VersionConfig {
  version: string;
  name?: string;
  shortName?: string;
  description?: string;
}

export type Version = VersionConfig | string;

export interface Default {
  description?: string;
  value: any;
}

export type DefaultValue = any | Default;

export interface Flag {
  description?: string;
  defaultValue?: DefaultValue;

  /**
   * required: true
   * This makes up the name: '-{shortName}, --{name} <{descriptiveType}>'
   *
   * required: false
   * This makes up the name: '-{shortName}, --{name} [descriptiveType]'
   *
   * required: false
   * variadic: true
   * This makes up the name: '-{shortName}, --{name} [descriptiveType...]'
   */
  required?: boolean;
  descriptiveType?: string;
  variadic?: boolean;

  choices?: string[]; // Especifica un conjunto de valores permitidos para esta opción o argumento
  preset?: any;
}

export interface Option extends Flag {
  name?: string;
  shortName?: string;

  hideHelp?: boolean; // No mmuestra la opción en la ayuda
  conflicts?: string[]; // Especifica que esta opción no puede ser usada junto con las opciones listadas
  implies?: Record<string, any>; // Especifica que si esta opción es usada, entonces las opciones listadas deben ser usadas con los valores especificados

  /**
   * hook: (value: any, previous: any) => any
   * Permite definir una función que se ejecutará cada vez que se establezca un valor para esta opción. La función recibe el nuevo valor y el valor anterior, y puede retornar un nuevo valor que será el que finalmente se establezca para la opción. Esto es útil para validar o transformar el valor antes de que sea utilizado por la aplicación.
   */
  hook?: (value: any, previous: any) => any;
}

export interface Argument extends Flag {
  descriptiveType: string; // se marca como obligatorio en argumentos
}

export interface CustomHelp {
  position: commander.AddHelpTextPosition;
  text: string;
}

export interface Command {
  name: string;
  description?: string;
  version?: Version;

  /**
   * The system executes both handlers.
   * First the action function in configuration and then the file with the handler function (handler function or default function)
   */
  /**
   * * This file must contain an anonymous function exported by default or a handler function:
   * - export default(...) => {}
   * - export const handler = (...) => {}
   * - export function handler(...) {}
   *
   * * The parameters, for all cases, are the same as the action function.
   * * - Input:
   *    - event: CommandEvent (object containing args and options)
   *    - command: commander.Command (commander command instance)
   *    - commandConfig: Command (user-defined command configuration)
   * * - Output: 
   *    - void
   *
   * Example of an action function:
   * (event: CommandEvent, command: commander.Command, commandConfig: Command) => void
   */
  path?: string;
  action?: (
    event: CommandEvent, // Objeto que contiene los argumentos y opciones del comando ejecutado
    command: commander.Command, // Instancia del comando de commander
    commandConfig: Command // Configuración del comando definida por el usuario
  ) => void;

  arguments?: Argument[];
  options?: Option[];

  customHelp?: CustomHelp[];
}
