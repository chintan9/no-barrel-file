#!/usr/bin/env node

import { Command } from "commander";
import { configureCountCommand } from "./commands/count";
import { configureDisplayCommand } from "./commands/display";
import { configureReplaceCommand } from "./commands/replace";
import packageJson from "../package.json";

const program = new Command();

program
  .name("no-barrel-file")
  .description("A CLI tool to find, count, and replace barrel file imports.")
  .version(packageJson.version);

// Global flags (equivalent to cmd/root.go init())
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

program.parse(process.argv);
