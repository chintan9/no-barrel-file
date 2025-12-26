"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureReplaceCommand = configureReplaceCommand;
const ts_morph_1 = require("ts-morph");
const path_1 = __importDefault(require("path"));
function configureReplaceCommand(program) {
    program
        .command("replace")
        .description("Replace barrel file imports with direct paths.")
        .option("-a, --alias-config-path <path>", "Relative path to tsconfig.json.")
        .option("-v, --verbose", "Enable verbose output.", false)
        .action(async (cmdOptions) => {
        const globalOptions = program.opts();
        if (!cmdOptions.aliasConfigPath) {
            console.error("Error: The --alias-config-path <path> option is required.");
            process.exit(1);
        }
        const tsConfigPath = path_1.default.resolve(globalOptions.rootPath, cmdOptions.aliasConfigPath);
        // We initialize the project. Note: ts-morph uses the global 'fs' 
        // which allows our Jest 'memfs' mock to intercept the calls.
        const project = new ts_morph_1.Project({
            tsConfigFilePath: tsConfigPath,
            // This ensures ts-morph uses the same fs-promises we might have mocked
            skipAddingFilesFromTsConfig: false
        });
        let updatedFilesCount = 0;
        for (const sourceFile of project.getSourceFiles()) {
            let fileWasModified = false;
            const importDeclarations = sourceFile.getImportDeclarations();
            for (const importDecl of importDeclarations) {
                const importSourceFile = importDecl.getModuleSpecifierSourceFile();
                if (!importSourceFile)
                    continue;
                if (path_1.default.basename(importSourceFile.getFilePath()).startsWith("index.")) {
                    const isBarrel = importSourceFile.getExportDeclarations().some((d) => !!d.getModuleSpecifier());
                    if (!isBarrel)
                        continue;
                    const newImports = {};
                    for (const named of importDecl.getNamedImports()) {
                        const symbol = named.getSymbolOrThrow();
                        const aliasedSymbol = symbol.getAliasedSymbol() || symbol;
                        const declaration = aliasedSymbol.getDeclarations()[0];
                        if (!declaration)
                            continue;
                        const originalSource = declaration.getSourceFile();
                        if (originalSource.getFilePath() === importSourceFile.getFilePath())
                            continue;
                        let relativePath = path_1.default.relative(path_1.default.dirname(sourceFile.getFilePath()), originalSource.getFilePath());
                        let importPath = relativePath.replace(/\.(ts|tsx|js|jsx)$/, "").replace(/\\/g, '/');
                        if (!importPath.startsWith("."))
                            importPath = `./${importPath}`;
                        if (!newImports[importPath])
                            newImports[importPath] = [];
                        const importName = named.getName();
                        const alias = named.getAliasNode()?.getText();
                        newImports[importPath].push(alias ? `${importName} as ${alias}` : importName);
                    }
                    if (Object.keys(newImports).length > 0) {
                        for (const [newPath, names] of Object.entries(newImports)) {
                            sourceFile.addImportDeclaration({ moduleSpecifier: newPath, namedImports: names });
                        }
                        importDecl.remove();
                        fileWasModified = true;
                    }
                }
            }
            if (fileWasModified) {
                await sourceFile.save();
                updatedFilesCount++;
            }
        }
        console.log(`${updatedFilesCount} files updated`);
    });
}
