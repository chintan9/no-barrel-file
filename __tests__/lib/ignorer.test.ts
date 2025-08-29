// Important: Use require for memfs inside Jest setup
const { vol } = require("memfs");
import { Ignorer } from "../../src/lib/ignorer";

// Mock the entire fs/promises module
jest.mock("fs/promises", () => require("memfs").promises);

describe("Ignorer Library", () => {
  beforeEach(() => {
    vol.reset(); // Clears the in-memory file system
  });

  it("should ignore files from .gitignore and ignorePaths", async () => {
    vol.fromJSON({
      "/.gitignore": "node_modules\n/dist",
      "/src/index.ts": "file content",
      "/src/legacy.js": "file content",
      "/node_modules/jest/index.js": "file content"
    });

    // Also ignore the specific legacy file
    const ignorer = await Ignorer.create("/", ["src/legacy.js"], ".gitignore");

    expect(ignorer.ignores("/src/index.ts")).toBe(false);
    expect(ignorer.ignores("/node_modules/jest/index.js")).toBe(true);
    expect(ignorer.ignores("/src/legacy.js")).toBe(true);
  });
});
