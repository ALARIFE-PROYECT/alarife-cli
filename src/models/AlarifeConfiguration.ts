import { Command } from '@alarife/commander';

export interface AlarifeConfiguration {
  cli: {
    /**
     * List of commands available in the CLI.
     */
    commands: Command[];
    /**
     * Path to the setup script for the CLI.
     * 
     * * This script should export a default function or a setup function.
     * *
     * * import { ProgramLineInterface } from '@alarife/commander';
     * * (pli: ProgramLineInterface) => void
     */
    setup: string;

    /**
     * If true, the version of the plugin will be displayed in the banner when running the CLI. This can be useful for debugging and ensuring that the correct version of the plugin is being used.
     */
    showVersionInBanner?: boolean;
  };
}
