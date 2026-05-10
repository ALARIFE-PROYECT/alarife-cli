#!/usr/bin/env node

import { setupCli } from "./services/command-line-interface";
import { discoverPlugins, setupPlugins } from "./services/dependency";


discoverPlugins();

const program = setupCli();

setupPlugins(program);

program.parse(process.argv, 'node');
