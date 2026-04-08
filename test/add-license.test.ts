import assert from 'assert';
import { test } from 'node:test';

import { Command } from '../src/models/Command';
// import { addCommand, opts, parse } from '../src';

// test('add-license test', () => {
//   /**
//    * command: add-license
//    * argument: ./lib (path) (REQUERIDO)
//    * option: --ext=js,ts (por defecto: *)
//    * option: --project-name=@alarife (REQUERIDO)
//    * option: --project-author=Soria Garcia, Jose Eduardo (REQUERIDO)
//    * option: --project-license=Apache-2.0 (por defecto: Apache-2.0)
//    */
//   const commandConfiguration: Command = {
//     name: 'add-license',
//     description: 'Add license to project',
//     action: () => {
//       console.log('hola');
//     },
//     // version: {
//     //   version: '1.0.0',
//     //   name: 'version',
//     //   shortName: 'v',
//     //   description: 'Show version'
//     // },
//     // customHelp: [
//     //   {
//     //     position: 'after',
//     //     text: 'Example:\n  add-license ./lib --ext=.js,.ts --project-name=@alarife --project-author=Soria Garcia, Jose Eduardo --project-license=Apache-2.0'
//     //   }
//     // ],
//     arguments: [
//       {
//         description: 'Path to add license',
//         required: true,
//         descriptiveType: 'path'
//       }
//     ],
//     options: [
//       {
//         name: 'extensions',
//         description: 'Extensions to add license',
//         defaultValue: '*',
//         descriptiveType: 'extensions'
//       },
//       // {
//       //   name: 'project-name',
//       //   description: 'Project name',
//       //   required: true
//       // },
//       // {
//       //   name: 'project-author',
//       //   description: 'Project author',
//       //   required: true
//       // },
//       // {
//       //   name: 'project-license',
//       //   description: 'Project license',
//       //   defaultValue: 'Apache-2.0'
//       // }
//     ]
//   };

//   addCommand(commandConfiguration);
//   parse([
//     // 'C:\\Users\\Indra\\AppData\\Roaming\\nvm\\v24.13.0\\node.exe',
//     // 'C:\\Users\\Indra\\Desktop\\workspace\\ALARIFE-PROYECT\\ALARIFE\\alarife-cli\\index.js',
//     'add-license',
//     './lib',
//     '--extensions=js,ts',
//     // '--project-name=@alarife',
//     // '--project-author=Soria',
//     // 'Garcia,',
//     // 'Jose',
//     // 'Eduardo',
//     // '--project-license=Apache-2.0'
//   ]);
//   console.log('OPT: ', opts());
// });
