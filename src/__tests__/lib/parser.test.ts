const { vol, fs: memfs } = require("memfs");
import fg from "fast-glob";
import { Parser } from "../../lib/parser";
import { Ignorer } from "../../lib/ignorer";

// Mock the modules
jest.mock("fs/promises", () => require("memfs").promises);
jest.mock("fast-glob");

// CORRECTED: Cast to `unknown` first, then to `jest.Mock`
const mockedFg = fg as unknown as jest.Mock;

describe("Parser Library", () => {
  beforeEach(() => {
    vol.reset();
    mockedFg.mockClear();
    jest.restoreAllMocks(); // Restore any spies
  });

  it("should find barrel files and ignore non-barrel index files", async () => {
    vol.fromJSON({
      "/src/components/index.ts": `export * from './button';`,
      "/src/components/button.ts": `// button code`,
      "/src/utils/index.ts": `export const myUtil = () => {};`
    });

    // Tell our fast-glob mock what files exist
    mockedFg.mockResolvedValue([
      "/src/components/index.ts",
      "/src/utils/index.ts"
    ]);

    const ignorer = await Ignorer.create("/", [], ".gitignore");
    const parser = new Parser("/", ignorer, [".ts"]);
    const barrelFiles = await parser.findBarrelFiles();

    expect(barrelFiles).toHaveLength(1);
    expect(barrelFiles[0]).toBe("/src/components/index.ts");
  });

  it("should return an empty array if no index files are found", async () => {
    vol.fromJSON({});
    mockedFg.mockResolvedValue([]); // fast-glob finds nothing

    const ignorer = await Ignorer.create("/", [], "");
    const parser = new Parser("/", ignorer, [".ts"]);
    const barrelFiles = await parser.findBarrelFiles();

    expect(barrelFiles).toHaveLength(0);
  });

  it("should ignore files specified by the ignorer", async () => {
    vol.fromJSON({
      "/.gitignore": "src/ignored",
      "/src/components/index.ts": `export * from './button';`,
      "/src/ignored/index.ts": `export * from './something';`
    });
    mockedFg.mockResolvedValue([
      "/src/components/index.ts",
      "/src/ignored/index.ts"
    ]);

    const ignorer = await Ignorer.create("/", [], ".gitignore");
    const parser = new Parser("/", ignorer, [".ts"]);
    const barrelFiles = await parser.findBarrelFiles();

    expect(barrelFiles).toHaveLength(1);
    expect(barrelFiles[0]).toBe("/src/components/index.ts");
  });

  it("should gracefully handle file read errors", async () => {
    vol.fromJSON({
      "/src/good/index.ts": `export * from './button';`,
      "/src/unreadable/index.ts": "" // exists but will be unreadable
    });
    mockedFg.mockResolvedValue([
      "/src/good/index.ts",
      "/src/unreadable/index.ts"
    ]);

    // FIX: Store the original readFile implementation to avoid infinite recursion.
    const originalReadFile = memfs.promises.readFile;

    // Mock readFile to throw an error for a specific file
    jest
      .spyOn(memfs.promises, "readFile")
      .mockImplementation(async (path: any, options: any) => {
        if (path === "/src/unreadable/index.ts") {
          throw new Error("EACCES: permission denied");
        }
        // FIX: Call the original implementation, not the spied-on function.
        // This prevents the "Maximum call stack size exceeded" error.
        return originalReadFile(path, options);
      });

    const ignorer = await Ignorer.create("/", [], "");
    const parser = new Parser("/", ignorer, [".ts"]);
    const barrelFiles = await parser.findBarrelFiles();

    // It should skip the unreadable file and find the good one
    expect(barrelFiles).toHaveLength(1);
    expect(barrelFiles[0]).toBe("/src/good/index.ts");
  });
});
