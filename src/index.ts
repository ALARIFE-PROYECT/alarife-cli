#!/usr/bin/env node

import { parserCli, setupCli } from "./services/command-line-interface";
import { discoverPlugins, setupPlugins } from "./services/dependency";


discoverPlugins();

const program = setupCli();

setupPlugins(program);

parserCli();
