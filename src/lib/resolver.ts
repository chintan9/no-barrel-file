import fs from "fs/promises";
import path from "path";
import { parse } from "jsonc-parser";

interface TsConfig {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
}

export class AliasResolver {
  private aliases: { prefix: string; paths: string[] }[] = [];
  private baseUrl: string;

  private constructor(
    private rootPath: string,
    private tsConfigPath: string | undefined
  ) {
    this.baseUrl = rootPath;
  }

  public static async create(
    rootPath: string,
    tsConfigPath: string | undefined
  ): Promise<AliasResolver> {
    const instance = new AliasResolver(rootPath, tsConfigPath);
    if (instance.tsConfigPath) {
      await instance.loadConfig();
    }
    return instance;
  }

  private async loadConfig(): Promise<void> {
    if (!this.tsConfigPath) return;

    try {
      const configFullPath = path.join(this.rootPath, this.tsConfigPath);
      const content = await fs.readFile(configFullPath, "utf-8");
      const config: TsConfig = parse(content);

      if (config.compilerOptions?.baseUrl) {
        this.baseUrl = path.resolve(
          path.dirname(configFullPath),
          config.compilerOptions.baseUrl
        );
      }

      if (config.compilerOptions?.paths) {
        this.aliases = Object.entries(config.compilerOptions.paths).map(
          ([key, value]) => ({
            prefix: key.replace(/\*$/, ""),
            paths: value.map((p) =>
              path.resolve(this.baseUrl, p.replace(/\*$/, ""))
            )
          })
        );
      }
    } catch (error) {
      console.warn(
        `Warning: Could not load or parse alias config at ${this.tsConfigPath}.`
      );
    }
  }

  public resolve(importPath: string): string | null {
    for (const alias of this.aliases) {
      if (importPath.startsWith(alias.prefix)) {
        const rest = importPath.substring(alias.prefix.length);
        // Return the first matching path
        return path.join(alias.paths[0], rest);
      }
    }
    return null;
  }
}
