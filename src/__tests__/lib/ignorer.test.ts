const { vol } = require("memfs");
import { Ignorer } from "../../lib/ignorer";

jest.mock("fs/promises", () => require("memfs").promises);

describe("Ignorer Library", () => {
  beforeEach(() => {
    vol.reset();
  });

  it("should ignore files from .gitignore and ignorePaths", async () => {
    vol.fromJSON({
      // Use patterns without leading slashes as is common in .gitignore
      "/.gitignore": "node_modules\ndist\nsrc/legacy.js",
      "/src/index.ts": "file content",
      "/src/legacy.js": "file content",
      "/node_modules/jest/index.js": "file content",
      "/config/secrets.json": "file content"
    });

    // Manually add the config directory to be ignored
    const ignorer = await Ignorer.create("/", ["config"], ".gitignore");

    // These files should NOT be ignored
    expect(ignorer.ignores("/src/index.ts")).toBe(false);

    // These files SHOULD be ignored
    expect(ignorer.ignores("/node_modules/jest/index.js")).toBe(true);
    expect(ignorer.ignores("/src/legacy.js")).toBe(true);
    expect(ignorer.ignores("/config/secrets.json")).toBe(true);
  });

  it("should function correctly when .gitignore does not exist", async () => {
    vol.fromJSON({
      "/src/index.ts": "file content",
      "/config/secrets.json": "file content"
    });

    const ignorer = await Ignorer.create(
      "/",
      ["config"],
      ".gitignore-does-not-exist"
    );

    expect(ignorer.ignores("/src/index.ts")).toBe(false);
    expect(ignorer.ignores("/config/secrets.json")).toBe(true);
  });

  it("should correctly handle empty or whitespace-only ignore paths", async () => {
    vol.fromJSON({
      "/.gitignore": "node_modules",
      "/src/index.ts": "file content",
      "/node_modules/jest/index.js": "file content"
    });

    // Pass an empty string and a whitespace string which should be filtered out
    const ignorer = await Ignorer.create("/", ["", "  "], ".gitignore");

    expect(ignorer.ignores("/src/index.ts")).toBe(false);
    expect(ignorer.ignores("/node_modules/jest/index.js")).toBe(true);
  });
});
