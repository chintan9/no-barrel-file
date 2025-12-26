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
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: { allowJs: true, checkJs: false },
    });
  }

  public async findBarrelFiles(): Promise<string[]> {
    const patternExtensions = this.extensions
      .map(e => (e.startsWith('.') ? e.slice(1) : e))
      .join(',');
    
    const indexFilePattern = `**/*index.{${patternExtensions}}`;
    const normalizedRoot = this.rootPath.replace(/\\/g, '/');

    const indexFiles = await fg(indexFilePattern, {
      cwd: normalizedRoot,
      absolute: true,
      onlyFiles: true,
    });

    const barrelFiles: string[] = [];
    if (!indexFiles) return [];

    for (const file of indexFiles) {
      if (this.ignorer.ignores(file)) continue;

      try {
        const content = await fs.readFile(file, 'utf-8');
        // Standardize path for ts-morph in-memory FS
        const normalizedFile = file.replace(/\\/g, '/');
        const sourceFile = this.project.createSourceFile(normalizedFile, content, { overwrite: true });
        
        const isBarrel = sourceFile.getExportDeclarations().some(decl => !!decl.getModuleSpecifier());

        if (isBarrel) {
          barrelFiles.push(file);
        }
        this.project.removeSourceFile(sourceFile);
      } catch (e) {
        // Silently skip
      }
    }

    return barrelFiles;
  }
}