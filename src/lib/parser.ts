import path from 'path';
import fg from 'fast-glob';
import fs from 'fs/promises';
import { Ignorer } from './ignorer';
import { Project } from 'ts-morph';

export class Parser {
  private project: Project;

  constructor(
    private rootPath: string,
    private ignorer: Ignorer,
    private extensions: string[]
  ) {
    // Initialize ts-morph with an in-memory file system to prevent 
    // unnecessary disk I/O and potential conflicts during analysis.
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: { allowJs: true, checkJs: false },
    });
  }

  public async findBarrelFiles(): Promise<string[]> {
    const patternExtensions = this.extensions
      .map(e => (e.startsWith('.') ? e.slice(1) : e))
      .join(',');
    
    // Search specifically for index files within the project
    const indexFilePattern = `**/*index.{${patternExtensions}}`;

    const indexFiles = await fg(indexFilePattern, {
      cwd: this.rootPath,
      absolute: true,
      onlyFiles: true,
    });

    const barrelFiles: string[] = [];

    if (!indexFiles) return [];

    for (const file of indexFiles) {
      if (this.ignorer.ignores(file)) {
        continue;
      }

      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Load the file into the in-memory project. 
        // 'overwrite: true' ensures we don't crash if the same file is processed twice.
        const sourceFile = this.project.createSourceFile(file, content, { overwrite: true });
        
        // A barrel file is defined as having at least one export declaration 
        // that points to another module (e.g., export * from './module').
        const isBarrel = sourceFile.getExportDeclarations().some(decl => {
          return !!decl.getModuleSpecifier();
        });

        if (isBarrel) {
          barrelFiles.push(file);
        }

        // Remove the file from the project immediately after check to keep memory usage low.
        this.project.removeSourceFile(sourceFile);
      } catch (e) {
        // Files that cannot be read or parsed are skipped.
      }
    }

    return barrelFiles;
  }
}