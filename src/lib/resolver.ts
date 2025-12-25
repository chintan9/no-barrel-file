import { Command } from "commander";
import { Project, ImportDeclaration } from "ts-morph";
import path from "path";

export function configureReplaceCommand(program: Command) {
  program
    .command("replace")
    .description("Replace barrel file imports with direct paths.")
    .option(
      "-a, --alias-config-path <path>",
      "Relative path to tsconfig.json or jsconfig.json for alias resolution."
    )
    .option("-v, --verbose", "Enable verbose output for detailed logs.", false)
    .action(async (cmdOptions) => {
      const globalOptions = program.opts();

      if (!cmdOptions.aliasConfigPath) {
        console.error(
          "Error: The --alias-config-path <path> option is required for the replace command."
        );
        process.exit(1);
      }

      const tsConfigPath = path.join(
        globalOptions.rootPath,
        cmdOptions.aliasConfigPath
      );

      // Initialize the project using the existing tsconfig to ensure 
      // ts-morph understands the project structure and aliases.
      const project = new Project({
        tsConfigFilePath: tsConfigPath,
      });

      let updatedFilesCount = 0;
      const projectSourceFiles = project.getSourceFiles();

      for (const sourceFile of projectSourceFiles) {
        let fileWasModified = false;
        const importDeclarations = sourceFile.getImportDeclarations();

        // Process each import in the file
        for (const importDecl of importDeclarations) {
          const importSourceFile = importDecl.getModuleSpecifierSourceFile();
          if (!importSourceFile) continue;

          // Identification: Is this importing from an index file?
          const fileName = path.basename(importSourceFile.getFilePath());
          if (fileName.startsWith("index.")) {
            
            // Verification: Does this index file actually re-export other modules?
            const isBarrel = importSourceFile
              .getExportDeclarations()
              .some((d) => !!d.getModuleSpecifier());
            
            if (!isBarrel) continue;

            // Map to hold new import paths and the names being imported from them
            const newImports: { [key: string]: string[] } = {};

            for (const named of importDecl.getNamedImports()) {
              const symbol = named.getSymbolOrThrow();
              const aliasedSymbol = symbol.getAliasedSymbol() || symbol;
              const declaration = aliasedSymbol.getDeclarations()[0];
              
              if (!declaration) continue;

              const originalSource = declaration.getSourceFile();
              const barrelFilePath = importSourceFile.getFilePath();
              const originalFilePath = originalSource.getFilePath();

              // If the symbol's actual definition is inside the barrel file itself,
              // we cannot "unroll" it further.
              if (originalFilePath === barrelFilePath) continue;

              // Calculate the relative path from the current file to the original source
              let relativePath = path.relative(
                path.dirname(sourceFile.getFilePath()),
                originalFilePath
              );

              // Normalize: remove extensions and ensure it starts with ./ or ../
              let importPath = relativePath.replace(/\.(ts|tsx|js|jsx)$/, "");
              if (!importPath.startsWith(".")) {
                importPath = `./${importPath}`;
              }

              // Web-standard imports use forward slashes even on Windows
              importPath = importPath.split(path.sep).join("/");

              if (!newImports[importPath]) newImports[importPath] = [];
              
              const importName = named.getName();
              const alias = named.getAliasNode()?.getText();
              newImports[importPath].push(
                alias ? `${importName} as ${alias}` : importName
              );
            }

            // If we found direct paths for the imports, update the file
            if (Object.keys(newImports).length > 0) {
              for (const [newPath, names] of Object.entries(newImports)) {
                sourceFile.addImportDeclaration({
                  moduleSpecifier: newPath,
                  namedImports: names,
                });
              }
              importDecl.remove();
              fileWasModified = true;
            }
          }
        }

        if (fileWasModified) {
          if (globalOptions.verbose) {
            console.log(`Updated imports in: ${sourceFile.getFilePath()}`);
          }
          await sourceFile.save();
          updatedFilesCount++;
        }
      }

      console.log(`${updatedFilesCount} files updated`);
    });
}