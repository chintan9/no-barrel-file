import { Command } from "commander";
import { Project } from "ts-morph";
import path from "path";

export function configureReplaceCommand(program: Command) {
  program
    .command("replace")
    .description("Replace barrel file imports with direct paths.")
    .option(
      "-a, --alias-config-path <path>",
      "Relative path to tsconfig.json for alias resolution."
    )
    .option("-v, --verbose", "Enable verbose output for detailed logs.", false)
    .action(async (cmdOptions) => {
      const globalOptions = program.opts();

      // **FIX:** Add a check to ensure the required option is provided.
      if (!cmdOptions.aliasConfigPath) {
        console.error(
          "Error: The --alias-config-path <path> option is required for the replace command."
        );
        process.exit(1); // Exit with an error code
      }

      const tsConfigPath = path.join(
        globalOptions.rootPath,
        cmdOptions.aliasConfigPath
      );

      const project = new Project({
        tsConfigFilePath: tsConfigPath
      });

      let updatedFilesCount = 0;
      const projectSourceFiles = project.getSourceFiles();

      for (const sourceFile of projectSourceFiles) {
        let fileWasModified = false;
        const importDeclarations = sourceFile.getImportDeclarations();

        for (const importDecl of importDeclarations) {
          const importSourceFile = importDecl.getModuleSpecifierSourceFile();
          if (!importSourceFile) continue;

          if (
            path.basename(importSourceFile.getFilePath()).startsWith("index.")
          ) {
            const isBarrel = importSourceFile
              .getExportDeclarations()
              .some((d) => d.getModuleSpecifier());
            if (!isBarrel) continue;

            const newImports: { [key: string]: string[] } = {};
            for (const named of importDecl.getNamedImports()) {
              const symbol = named.getSymbolOrThrow();
              const aliasedSymbol = symbol.getAliasedSymbol() || symbol;
              const originalSource = aliasedSymbol
                .getDeclarations()[0]
                ?.getSourceFile();
              if (
                !originalSource ||
                originalSource.getFilePath() === importSourceFile.getFilePath()
              )
                continue;

              const originalFilePath = originalSource.getFilePath();
              const relativePath = path.relative(
                path.dirname(sourceFile.getFilePath()),
                originalFilePath
              );
              const importPath = `./${relativePath}`.replace(
                /\.(ts|tsx|js|jsx)$/,
                ""
              );

              if (!newImports[importPath]) newImports[importPath] = [];
              const importName = named.getName();
              const alias = named.getAliasNode()?.getText();
              newImports[importPath].push(
                alias ? `${importName} as ${alias}` : importName
              );
            }

            if (Object.keys(newImports).length > 0) {
              for (const [newPath, names] of Object.entries(newImports)) {
                sourceFile.addImportDeclaration({
                  moduleSpecifier: newPath,
                  namedImports: names
                });
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
