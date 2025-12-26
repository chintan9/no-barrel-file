"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureCountCommand = configureCountCommand;
const ignorer_1 = require("../lib/ignorer");
const parser_1 = require("../lib/parser");
function configureCountCommand(program) {
    program
        .command("count")
        .description("Count the number of barrel files in the specified project.")
        .action(async () => {
        const options = program.opts();
        const ignorer = await ignorer_1.Ignorer.create(options.rootPath, options.ignorePaths.split(","), options.gitignorePath);
        const parser = new parser_1.Parser(options.rootPath, ignorer, options.extensions.split(","));
        const barrelFiles = await parser.findBarrelFiles();
        console.log(barrelFiles.length);
    });
}
