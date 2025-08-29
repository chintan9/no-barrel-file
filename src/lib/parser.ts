import path from 'path';
import fg from 'fast-glob';
import fs from 'fs/promises'; // Use the mocked fs
import { Ignorer } from './ignorer';
import { Project } from 'ts-morph';

export class Parser {
  private project: Project;

  constructor(
    private rootPath: string,
    private ignorer: Ignorer,
    private extensions: string[]
  ) {
    // CORRECTED: Tell ts-morph to use an in-memory file system
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: { allowJs: true, checkJs: false },
    });
  }

  public async findBarrelFiles(): Promise<string[]> {
    const patternExtensions = this.extensions.map(e => e.startsWith('.') ? e.slice(1) : e).join(',');
    const indexFilePattern = `**/*index.{${patternExtensions}}`;

    const indexFiles = await fg(indexFilePattern, {
      cwd: this.rootPath,
      absolute: true,
      onlyFiles: true,
    });

    const barrelFiles: string[] = [];

    // This check is necessary because the mock might return undefined if not set up
    if (!indexFiles) {
      return [];
    }

    for (const file of indexFiles) {
      if (this.ignorer.ignores(file)) {
        continue;
      }

      try {
        // CORRECTED: Read content from memfs and create the source file in memory
        const content = await fs.readFile(file, 'utf-8');
        const sourceFile = this.project.createSourceFile(file, content);
        
        let isBarrel = false;
        sourceFile.getExportDeclarations().forEach(decl => {
          if (decl.getModuleSpecifier()) {
            isBarrel = true;
          }
        });

        if (isBarrel) {
          barrelFiles.push(file);
        }

        // Clean up the project to save memory
        this.project.removeSourceFile(sourceFile);
      } catch (e) {
        // Ignore files that can't be read, consistent with original error
      }
    }

    return barrelFiles;
  }
}