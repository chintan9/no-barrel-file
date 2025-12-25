import fs from "fs/promises";
import path from "path";
import ignore from "ignore";

export class Ignorer {
  private ig;

  private constructor(private rootPath: string) {
    // The 'ignore' package is the standard for handling .gitignore-style patterns
    this.ig = ignore();
  }

  /**
   * Factory method to handle asynchronous loading of ignore files.
   */
  public static async create(
    rootPath: string,
    ignorePaths: string[],
    gitIgnorePath: string
  ): Promise<Ignorer> {
    const instance = new Ignorer(rootPath);
    await instance.loadGitignore(gitIgnorePath);
    instance.addManualIgnores(ignorePaths);
    return instance;
  }

  private async loadGitignore(gitIgnorePath: string): Promise<void> {
    try {
      const fullPath = path.resolve(this.rootPath, gitIgnorePath);
      const content = await fs.readFile(fullPath, "utf-8");
      this.ig.add(content);
    } catch (error) {
      // It is perfectly fine if a .gitignore doesn't exist; we just skip it.
    }
  }

  private addManualIgnores(ignorePaths: string[]): void {
    if (ignorePaths && ignorePaths.length > 0) {
      // Filter out empty strings and add manual paths to the ignore manager
      const validPaths = ignorePaths
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      
      this.ig.add(validPaths);
    }
  }

  /**
   * Checks if a specific absolute file path should be ignored.
   */
  public ignores(filePath: string): boolean {
    // 'ignore' library expects paths relative to the root where the ignore rules apply
    const relativePath = path.relative(this.rootPath, filePath);
    
    if (!relativePath) return false;
    
    return this.ig.ignores(relativePath);
  }
}