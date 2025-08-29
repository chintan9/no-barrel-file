#!/usr/bin/env node

import { Command } from "commander";
import { configureCountCommand } from "./commands/count";
import { configureDisplayCommand } from "./commands/display";
import { configureReplaceCommand } from "./commands/replace";
// Assuming package.json is in the root, one level up from src/
import packageJson from "../package.json";

// EXPORT this constant
export const program = new Command();

program
  .name("no-barrel-file")
  .description("A CLI tool to find, count, and replace barrel file imports.")
  .version(packageJson.version);

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

// Register commands
configureCountCommand(program);
configureDisplayCommand(program);
configureReplaceCommand(program);

// This allows the file to be run directly from the command line
if (require.main === module) {
  program.parse(process.argv);
}
