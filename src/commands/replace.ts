import { Command } from "commander";
import { Project, SourceFile, ImportDeclaration, Symbol, ts } from "ts-morph";
import fg from "fast-glob";
import path from "path";
import { Ignorer } from "../lib/ignorer";
import { AliasResolver } from "../lib/resolver";

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
      const project = new Project({
        tsConfigFilePath: cmdOptions.aliasConfigPath
          ? path.join(globalOptions.rootPath, cmdOptions.aliasConfigPath)
          : undefined,
        libFolderPath: require.resolve("typescript").replace("index.js", "")
      });

      const ignorer = await Ignorer.create(
        globalOptions.rootPath,
        globalOptions.ignorePaths.split(","),
        globalOptions.gitignorePath
      );

      console.log("Analyzing project structure...");
      const sourceFiles = await fg(`**/*{${globalOptions.extensions}}`, {
        cwd: globalOptions.rootPath,
        absolute: true,
        ignore: ["node_modules/**"]
      });

      let updatedFilesCount = 0;

      for (const filePath of sourceFiles) {
        if (ignorer.ignores(filePath)) continue;
        const sourceFile = project.addSourceFileAtPath(filePath);
        let fileWasModified = false;

        const importDeclarations = sourceFile.getImportDeclarations();
        for (const importDecl of importDeclarations) {
          const importSourceFile = importDecl.getModuleSpecifierSourceFile();
          if (!importSourceFile) continue;

          // Check if the imported file is a barrel file (index file that re-exports)
          if (
            path.basename(importSourceFile.getFilePath()).startsWith("index.")
          ) {
            const isBarrel = importSourceFile
              .getExportDeclarations()
              .some((d) => d.getModuleSpecifier());
            if (!isBarrel) continue;

            const newImports: { [key: string]: string[] } = {};

            // For each named import, find its original source
            for (const named of importDecl.getNamedImports()) {
              const symbol = named.getSymbol();
              if (!symbol) continue;

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
              if (cmdOptions.verbose) {
                console.log(
                  `\nReplacing imports in: ${path.relative(
                    globalOptions.rootPath,
                    sourceFile.getFilePath()
                  )}`
                );
                console.log(`-  ${importDecl.getText()}`);
              }

              // Add new direct imports
              for (const [newPath, names] of Object.entries(newImports)) {
                const newImportText = `import { ${names.join(
                  ", "
                )} } from '${newPath}';`;
                sourceFile.addImportDeclaration({
                  moduleSpecifier: newPath,
                  namedImports: names
                });
                if (cmdOptions.verbose) console.log(`+  ${newImportText}`);
              }

              // Remove the old barrel import
              importDecl.remove();
              fileWasModified = true;
            }
          }
        }

        if (fileWasModified) {
          await sourceFile.save();
          updatedFilesCount++;
        }

        project.removeSourceFile(sourceFile); // Conserve memory
      }

      console.log(`\n${updatedFilesCount} files updated.`);
    });
}
