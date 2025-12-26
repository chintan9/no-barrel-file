"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const fast_glob_1 = __importDefault(require("fast-glob"));
const promises_1 = __importDefault(require("fs/promises"));
const ts_morph_1 = require("ts-morph");
class Parser {
    constructor(rootPath, ignorer, extensions) {
        this.rootPath = rootPath;
        this.ignorer = ignorer;
        this.extensions = extensions;
        this.project = new ts_morph_1.Project({
            useInMemoryFileSystem: true,
            compilerOptions: { allowJs: true, checkJs: false },
        });
    }
    async findBarrelFiles() {
        const patternExtensions = this.extensions
            .map(e => (e.startsWith('.') ? e.slice(1) : e))
            .join(',');
        const indexFilePattern = `**/*index.{${patternExtensions}}`;
        const normalizedRoot = this.rootPath.replace(/\\/g, '/');
        const indexFiles = await (0, fast_glob_1.default)(indexFilePattern, {
            cwd: normalizedRoot,
            absolute: true,
            onlyFiles: true,
        });
        const barrelFiles = [];
        if (!indexFiles)
            return [];
        for (const file of indexFiles) {
            if (this.ignorer.ignores(file))
                continue;
            try {
                const content = await promises_1.default.readFile(file, 'utf-8');
                // Standardize path for ts-morph in-memory FS
                const normalizedFile = file.replace(/\\/g, '/');
                const sourceFile = this.project.createSourceFile(normalizedFile, content, { overwrite: true });
                const isBarrel = sourceFile.getExportDeclarations().some(decl => !!decl.getModuleSpecifier());
                if (isBarrel) {
                    barrelFiles.push(file);
                }
                this.project.removeSourceFile(sourceFile);
            }
            catch (e) {
                // Silently skip
            }
        }
        return barrelFiles;
    }
}
exports.Parser = Parser;
