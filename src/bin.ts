#!/usr/bin/env node

import { parserCli, setupCli } from "./services/command-line-interface";
import { setupPlugins } from "./services/dependencies";
import { discover } from "./services/discover";


discover();

const program = setupCli();

setupPlugins(program);

parserCli();
