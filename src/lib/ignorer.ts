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
      const fullPath = path.join(this.rootPath, gitIgnorePath);
      const content = await fs.readFile(fullPath, "utf-8");
      this.ig.add(content);
    } catch (error) {
      // Gitignore file might not exist, which is acceptable.
    }
  }

  private addManualIgnores(ignorePaths: string[]): void {
    if (ignorePaths && ignorePaths.length > 0) {
      this.ig.add(ignorePaths.filter((p) => p.trim() !== ""));
    }
  }

  public ignores(filePath: string): boolean {
    const relativePath = path.relative(this.rootPath, filePath);
    return this.ig.ignores(relativePath);
  }
}
