const { vol } = require("memfs");
import fg from "fast-glob";
import { program } from "../index"; // Corrected import path

// Mock dependencies
// THIS IS THE CRITICAL FIX: Mock both sync and async fs to point to memfs
jest.mock("fs", () => require("memfs").fs);
jest.mock("fs/promises", () => require("memfs").fs.promises);
jest.mock("fast-glob");

const mockedFg = fg as unknown as jest.Mock;

// Capture console.log output
let consoleOutput: any[];
const mockedLog = (output: any) => consoleOutput.push(output);

describe("CLI Commands (Integration)", () => {
  beforeEach(() => {
    vol.reset(); // Clears the in-memory file system before each test
    mockedFg.mockClear();
    consoleOutput = [];
    jest.spyOn(console, "log").mockImplementation(mockedLog);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should count the barrel files correctly", async () => {
    vol.fromJSON({
      "/project/src/components/index.ts": `export * from './button';`,
      "/project/src/utils/index.ts": `export const util = {};`
    });
    mockedFg.mockResolvedValue([
      "/project/src/components/index.ts",
      "/project/src/utils/index.ts"
    ]);

    const argv = [
      "node",
      "no-barrel-file",
      "count",
      "--root-path",
      "/project",
      "--extensions",
      ".ts"
    ];
    await program.parseAsync(argv);

    expect(consoleOutput[0]).toBe(1);
  });

  it("should display the barrel files correctly", async () => {
    vol.fromJSON({
      "/project/src/components/index.ts": `export * from './button';`,
      "/project/src/utils/index.ts": `export const util = {};`
    });
    mockedFg.mockResolvedValue([
      "/project/src/components/index.ts",
      "/project/src/utils/index.ts"
    ]);

    const argv = [
      "node",
      "no-barrel-file",
      "display",
      "--root-path",
      "/project",
      "--extensions",
      ".ts"
    ];
    await program.parseAsync(argv);

    expect(consoleOutput[0]).toBe("1 barrel files found");
    expect(consoleOutput[1]).toBe("src/components/index.ts");
  });

  it("should replace barrel imports with direct paths", async () => {
    const projectFiles = {
      "/project/src/components/button.ts": `export const Button = {};`,
      "/project/src/components/index.ts": `export * from './button';`,
      "/project/src/app.ts": `import { Button } from 'components';`,
      "/project/tsconfig.json": `{
        "include": ["src/**/*.ts"],
        "compilerOptions": {
          "baseUrl": "src",
          "paths": { "components": ["components/index"] }
        }
      }`
    };
    vol.fromJSON(projectFiles, "/project");

    const argv = [
      "node",
      "no-barrel-file",
      "replace",
      "--root-path",
      "/project",
      "--alias-config-path",
      "tsconfig.json"
    ];
    await program.parseAsync(argv);

    const updatedContent = vol.readFileSync("/project/src/app.ts", "utf-8");

    expect(updatedContent).not.toContain(`from 'components'`);
    expect(updatedContent).toContain(`from "./components/button"`);
    expect(consoleOutput.join("\n")).toContain("1 files updated");
  });
});
