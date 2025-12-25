#!/usr/bin/env node

import { Command } from "commander";
import { configureCountCommand } from "./commands/count";
import { configureDisplayCommand } from "./commands/display";
import { configureReplaceCommand } from "./commands/replace";
import path from "path";

// Using 'require' ensures TypeScript does not include the root directory 
// in the 'src' compilation scope, which fixes the 'rootDir' build error.
const pkg = require(path.join(__dirname, "../package.json"));

// Export the program constant for integration testing
export const program = new Command();

program
  .name("no-barrel-file")
  .description("A CLI tool to find, count, and replace barrel file imports.")
  .version(pkg.version);

// Global flags
program
  .option(
    "-r, --root-path <path>",
    "Root path of the targeted project.",
    process.cwd()
  )
  .option(
    "-e, --extensions <exts>",
    "Comma-separated list of file extensions to process.",
    ".ts,.js,.tsx,.jsx"
  )
  .option(
    "-i, --ignore-paths <paths>",
    "Comma-separated list of directories or files to ignore.",
    ""
  )
  .option(
    "-g, --gitignore-path <path>",
    "Relative path to .gitignore file.",
    ".gitignore"
  );

// Register sub-commands
configureCountCommand(program);
configureDisplayCommand(program);
configureReplaceCommand(program);

// Execute the CLI
if (require.main === module) {
  program.parse(process.argv);
}