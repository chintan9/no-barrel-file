"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureDisplayCommand = configureDisplayCommand;
const path_1 = __importDefault(require("path"));
const ignorer_1 = require("../lib/ignorer");
const parser_1 = require("../lib/parser");
function configureDisplayCommand(program) {
    program
        .command("display")
        .description("Display all barrel files found in the specified project.")
        .action(async () => {
        const options = program.opts();
        const ignorer = await ignorer_1.Ignorer.create(options.rootPath, options.ignorePaths.split(","), options.gitignorePath);
        const parser = new parser_1.Parser(options.rootPath, ignorer, options.extensions.split(","));
        const barrelFiles = await parser.findBarrelFiles();
        console.log(`${barrelFiles.length} barrel files found`);
        for (const file of barrelFiles) {
            // FIX: Normalize to forward slashes for consistent CLI output across OS
            const relativePath = path_1.default.relative(options.rootPath, file).replace(/\\/g, '/');
            console.log(relativePath);
        }
    });
}
