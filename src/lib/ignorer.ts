import fs from "fs/promises";
import path from "path";
import ignore from "ignore";

export class Ignorer {
  private ig;

  private constructor(private rootPath: string) {
    this.ig = ignore();
  }

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
      // Skip if .gitignore doesn't exist
    }
  }

  private addManualIgnores(ignorePaths: string[]): void {
    if (ignorePaths && ignorePaths.length > 0) {
      const validPaths = ignorePaths
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      
      this.ig.add(validPaths);
    }
  }

  public ignores(filePath: string): boolean {
    const relativePath = path.relative(this.rootPath, filePath);
    if (!relativePath) return false;
    
    // FIX: Normalize backslashes to forward slashes for the 'ignore' library
    const posixPath = relativePath.replace(/\\/g, '/');
    return this.ig.ignores(posixPath);
  }
}