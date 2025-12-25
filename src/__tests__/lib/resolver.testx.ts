const { vol } = require("memfs");
import { AliasResolver } from "../../lib/resolver";

jest.mock("fs/promises", () => require("memfs").promises);

describe("AliasResolver Library", () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    vol.reset();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("should resolve an alias from tsconfig.json", async () => {
    vol.fromJSON({
      "/project/tsconfig.json": `{
        "compilerOptions": {
          "baseUrl": "./src",
          "paths": {
            "@components/*": ["components/*"]
          }
        }
      }`,
      "/project/src/components/Button.ts": "export const Button = {};"
    });

    const resolver = await AliasResolver.create("/project", "tsconfig.json");
    const resolvedPath = resolver.resolve("@components/Button");

    // path.join behavior differs on OS, so check for a consistent format
    expect(resolvedPath?.replace(/\\/g, "/")).toBe(
      "/project/src/components/Button"
    );
  });

  it("should return null for a non-aliased path", async () => {
    vol.fromJSON({
      "/project/tsconfig.json": `{
        "compilerOptions": {
          "baseUrl": ".",
          "paths": {
            "@/*": ["src/*"]
          }
        }
      }`
    });

    const resolver = await AliasResolver.create("/project", "tsconfig.json");
    const resolvedPath = resolver.resolve("some/other/path");

    expect(resolvedPath).toBeNull();
  });

  it("should handle tsconfig with comments (JSONC)", async () => {
    vol.fromJSON({
      "/project/tsconfig.json": `{
        // This is a comment
        "compilerOptions": {
          "baseUrl": "src",
          "paths": {
            "@utils/*": ["utils/*"] // another comment
          }
        }
      }`
    });

    const resolver = await AliasResolver.create("/project", "tsconfig.json");
    const resolvedPath = resolver.resolve("@utils/helpers");

    expect(resolvedPath?.replace(/\\/g, "/")).toBe(
      "/project/src/utils/helpers"
    );
  });

  it("should warn and not fail if tsconfig.json is missing", async () => {
    // No tsconfig.json in vol
    const resolver = await AliasResolver.create(
      "/project",
      "non-existent-config.json"
    );
    const resolvedPath = resolver.resolve("@any/path");

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Warning: Could not load or parse alias config at non-existent-config.json."
    );
    expect(resolvedPath).toBeNull();
  });

  it("should function without a config path provided", async () => {
    const resolver = await AliasResolver.create("/project", undefined);
    const resolvedPath = resolver.resolve("some/path");

    expect(resolvedPath).toBeNull();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it("should handle a tsconfig without paths or baseUrl", async () => {
    vol.fromJSON({
      "/project/tsconfig.json": `{
        "compilerOptions": {
          "target": "ES2020"
        }
      }`
    });

    const resolver = await AliasResolver.create("/project", "tsconfig.json");
    const resolvedPath = resolver.resolve("@any/path");

    expect(resolvedPath).toBeNull();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
