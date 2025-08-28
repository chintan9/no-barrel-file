import path from "path";
import fg from "fast-glob";
import { Ignorer } from "./ignorer";
import { Project, ts, SyntaxKind } from "ts-morph";

export class Parser {
  private project: Project;

  constructor(
    private rootPath: string,
    private ignorer: Ignorer,
    private extensions: string[]
  ) {
    this.project = new Project({
      // Suppress errors for parsing-only purposes
      compilerOptions: { allowJs: true, checkJs: false }
    });
  }

  public async findBarrelFiles(): Promise<string[]> {
    const indexFilePattern = `**/*index.{${this.extensions
      .map((e) => e.slice(1))
      .join(",")}}`;
    const indexFiles = await fg(indexFilePattern, {
      cwd: this.rootPath,
      absolute: true,
      onlyFiles: true
    });

    const barrelFiles: string[] = [];

    for (const file of indexFiles) {
      if (this.ignorer.ignores(file)) {
        continue;
      }

      const sourceFile = this.project.addSourceFileAtPath(file);
      let isBarrel = false;
      sourceFile.getExportDeclarations().forEach((decl) => {
        if (decl.getModuleSpecifier()) {
          // This is an `export ... from '...'` statement
          isBarrel = true;
        }
      });

      if (isBarrel) {
        barrelFiles.push(file);
      }

      // Forget the source file to manage memory
      this.project.removeSourceFile(sourceFile);
    }

    return barrelFiles;
  }
}
