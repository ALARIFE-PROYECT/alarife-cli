# @alarife/cli - Tool for command management in Alarife.

<div align="center">

[![NPM Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://www.npmjs.com/package/@alarife/cli)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

**This tool is a command-line implementation of cli.**

</div>

## 📋 Table of Contents

- [Installation](#-installation)
- [Basic Usage](#-basic-usage)
- [Detailed API](#-detailed-api)
- [License](#-license)

## 🚀 Installation

```bash
npm install @alarife/cli --save-dev
```

## 📦 Basic Usage

### Defining a command

```typescript
import { ProgramLineInterface, Command } from '@alarife/cli';

const greet: Command = {
  name: 'greet',
  description: 'Greet a user by name',
  action: (event) => {
    const [name] = event.args;
    console.log(`Hello, ${name}!`);
  },
  arguments: [
    {
      descriptiveType: 'name',
      description: 'Name of the user to greet',
      required: true,
    },
  ],
};

const program = new ProgramLineInterface([greet]);
program.parse(process.argv, 'node');
```

```bash
node app.js greet World
# Hello, World!
```

### Adding options

```typescript
const build: Command = {
  name: 'build',
  description: 'Build the project',
  action: (event) => {
    console.log(event.options); // { outDir: 'dist', minify: true }
  },
  options: [
    {
      name: 'out-dir',
      shortName: 'o',
      descriptiveType: 'path',
      description: 'Output directory',
      defaultValue: 'dist',
    },
    {
      name: 'minify',
      shortName: 'm',
      description: 'Minify the output',
    },
  ],
};
```

```bash
node app.js build --out-dir lib --minify
```

### Using an external handler

```typescript
const copy: Command = {
  name: 'copy',
  description: 'Copy files from source to target',
  path: './handlers/copy.js',
  arguments: [
    { descriptiveType: 'source', required: true },
    { descriptiveType: 'target', required: true },
  ],
};
```

```typescript
// handlers/copy.ts
import { CommandEvent, Command } from '@alarife/cli';

export default (event: CommandEvent) => {
  const [source, target] = event.args;
  // copy logic...
};
```

## 📖 Detailed API

### `ProgramLineInterface`

Main entry point. Creates a CLI program and registers commands.

```typescript
const program = new ProgramLineInterface(commands?: Command[], version?: Version);
```

| Method | Description |
|---|---|
| `addCommand(command: Command)` | Register a new command. |
| `addArgument(commandName: string, argument: Argument)` | Add a positional argument to an existing command. |
| `addOption(commandName: string, option: Option)` | Add an option to an existing command. |
| `parse(args: string[], from?: ParserFrom)` | Parse arguments and execute the matched command. Returns `CommandEvent`. |

`ParserFrom` can be `'node'`, `'electron'`, or `'user'` (default).

---

### `Command`

Declarative configuration object for a CLI command.

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | ✅ | Command name used in the terminal. |
| `description` | `string` | | Help text for the command. |
| `version` | `Version` | | Command-specific version. |
| `path` | `string` | | Path to a `.js` handler file. |
| `action` | `(event, command, config) => void` | | Inline handler function. |
| `arguments` | `Argument[]` | | Positional arguments. |
| `options` | `Option[]` | | Named options / flags. |

> Both `action` and `path` can coexist — both will execute.

---

### `Argument`

Positional argument for a command.

| Property | Type | Required | Description |
|---|---|---|---|
| `descriptiveType` | `string` | ✅ | Display name shown in help (e.g. `path`, `source`). |
| `description` | `string` | | Help text. |
| `required` | `boolean` | | Wraps in `<name>` when true, `[name]` when false. |
| `variadic` | `boolean` | | Accept multiple values (`<name...>`). |
| `choices` | `string[]` | | Restrict to a set of allowed values. |
| `defaultValue` | `any` | | Default value when not provided. |

---

### `Option`

Named flag for a command.

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | | Long flag name (e.g. `extensions` → `--extensions`). |
| `shortName` | `string` | | Short flag alias (e.g. `ex` → `-ex`). |
| `descriptiveType` | `string` | | Type label shown in help. |
| `description` | `string` | | Help text. |
| `required` | `boolean` | | Mark the option as mandatory. |
| `variadic` | `boolean` | | Accept multiple values. |
| `choices` | `string[]` | | Restrict to allowed values. |
| `defaultValue` | `any` | | Default value. |
| `hideHelp` | `boolean` | | Hide from auto-generated help. |
| `conflicts` | `string[]` | | Mutually exclusive options. |
| `implies` | `Record<string, any>` | | Set other options when this one is used. |
| `hook` | `(value, previous) => any` | | Transform the parsed value. |

> Option names are converted to **camelCase** internally: `--project-name` → `options.projectName`.

---

### `CommandEvent`

Returned by `parse()` and passed to handlers.

```typescript
interface CommandEvent {
  args: any[];                   // Positional arguments in order
  options: Record<string, any>;  // Parsed options (camelCase keys)
}
```

---

### `Version`

Can be a plain string or a configuration object.

```typescript
// Simple
const program = new ProgramLineInterface([], '1.0.0');

// Detailed
const program = new ProgramLineInterface([], {
  version: '1.0.0',
  name: 'version',
  shortName: 'v',
  description: 'Show the current version',
});
```

## 📄 License

This project is licensed under Apache-2.0. See the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Jose Eduardo Soria Garcia](mailto:alarifeproyect@gmail.com)**

<sub>🌍 Product developed in Andalucia, España 🇪🇸</sub>

*Part of the Alarife ecosystem*

</div>

