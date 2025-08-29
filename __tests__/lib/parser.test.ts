const { vol } = require("memfs");
import fg from "fast-glob";
import { Parser } from "../../src/lib/parser";
import { Ignorer } from "../../src/lib/ignorer";

// Mock the modules
jest.mock("fs/promises", () => require("memfs").promises);
jest.mock("fast-glob");

// CORRECTED: Cast to `unknown` first, then to `jest.Mock`
const mockedFg = fg as unknown as jest.Mock;

describe("Parser Library", () => {
  beforeEach(() => {
    vol.reset();
    mockedFg.mockClear();
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
});
