import { Command } from "commander";
import { Project } from "ts-morph";
import fg from "fast-glob";
import path from "path";
import fs from "fs/promises"; // Use the mocked fs
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

      // CORRECTED: Force ts-morph to use an in-memory file system for tests
      const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: {
          // You might need to adjust this based on your project structure
          baseUrl: globalOptions.rootPath
        }
      });

      const ignorer = await Ignorer.create(
        globalOptions.rootPath,
        globalOptions.ignorePaths.split(","),
        globalOptions.gitignorePath
      );

      const extensions = globalOptions.extensions
        .split(",")
        .map((e: string) => (e.startsWith(".") ? e.slice(1) : e))
        .join(",");
      const sourceFilesPaths = await fg(`**/*.{${extensions}}`, {
        cwd: globalOptions.rootPath,
        absolute: true,
        ignore: ["node_modules/**"]
      });

      // CORRECTED: Manually load all source files into ts-morph's in-memory system
      for (const filePath of sourceFilesPaths) {
        if (ignorer.ignores(filePath)) continue;
        const content = await fs.readFile(filePath, "utf-8");
        project.createSourceFile(filePath, content);
      }

      let updatedFilesCount = 0;

      const projectSourceFiles = project.getSourceFiles();
      for (const sourceFile of projectSourceFiles) {
        let fileWasModified = false;

        // ... (The rest of the logic remains the same)
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
          // Save the changes back to the in-memory file system
          const updatedContent = sourceFile.getFullText();
          await fs.writeFile(sourceFile.getFilePath(), updatedContent);
          updatedFilesCount++;
        }
      }

      console.log(`${updatedFilesCount} files updated`);
    });
}
