#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
const commander_1 = require("commander");
const count_1 = require("./commands/count");
const display_1 = require("./commands/display");
const replace_1 = require("./commands/replace");
// Using 'require' ensures TypeScript does not include the root directory 
// in the 'src' compilation scope, which fixes the 'rootDir' build error.
const pkg = require("../package.json");
// Export the program constant for integration testing
exports.program = new commander_1.Command();
exports.program
    .name("no-barrel-file")
    .description("A CLI tool to find, count, and replace barrel file imports.")
    .version(pkg.version);
// Global flags
exports.program
    .option("-r, --root-path <path>", "Root path of the targeted project.", process.cwd())
    .option("-e, --extensions <exts>", "Comma-separated list of file extensions to process.", ".ts,.js,.tsx,.jsx")
    .option("-i, --ignore-paths <paths>", "Comma-separated list of directories or files to ignore.", "")
    .option("-g, --gitignore-path <path>", "Relative path to .gitignore file.", ".gitignore");
// Register sub-commands
(0, count_1.configureCountCommand)(exports.program);
(0, display_1.configureDisplayCommand)(exports.program);
(0, replace_1.configureReplaceCommand)(exports.program);
// Execute the CLI
if (require.main === module) {
    exports.program.parse(process.argv);
}
