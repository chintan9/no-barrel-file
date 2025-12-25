const { vol } = require("memfs");
import fg from "fast-glob";
import { program } from "../index";

// Mocking the file system to use an in-memory volume (memfs)
jest.mock("fs", () => require("memfs").fs);
jest.mock("fs/promises", () => require("memfs").fs.promises);
jest.mock("fast-glob");

const mockedFg = fg as unknown as jest.Mock;

// Utility to capture console logs so we can assert on them
let consoleOutput: any[];
const mockedLog = (output: any) => consoleOutput.push(output);

describe("CLI Commands (Integration)", () => {
  beforeEach(() => {
    vol.reset(); // Clear the virtual disk before each test
    mockedFg.mockClear();
    consoleOutput = [];
    jest.spyOn(console, "log").mockImplementation(mockedLog);
    jest.spyOn(console, "error").mockImplementation(mockedLog);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should count the barrel files correctly", async () => {
    vol.fromJSON({
      "/project/src/components/index.ts": `export * from './button';`,
      "/project/src/utils/index.ts": `export const util = {};`
    });
    
    // fast-glob needs to be mocked because it doesn't automatically use memfs
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

    // Only one is a barrel (components/index.ts), the other is just a regular index.
    expect(consoleOutput).toContain(1);
  });

  it("should display the barrel files correctly", async () => {
    vol.fromJSON({
      "/project/src/components/index.ts": `export * from './button';`
    });
    mockedFg.mockResolvedValue(["/project/src/components/index.ts"]);

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

    expect(consoleOutput).toContain("1 barrel files found");
    expect(consoleOutput).toContain("src/components/index.ts");
  });

  it("should replace barrel imports with direct paths", async () => {
    // Setup a mini-project structure
    const projectFiles = {
      "/project/src/components/button.ts": `export const Button = {};`,
      "/project/src/components/index.ts": `export * from './button';`,
      "/project/src/app.ts": `import { Button } from './components/index';`,
      "/project/tsconfig.json": JSON.stringify({
        compilerOptions: {
          baseUrl: ".",
          paths: { "*": ["src/*"] }
        }
      })
    };
    vol.fromJSON(projectFiles);

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

    // Verify the content of app.ts was changed from index to button
    const updatedContent = vol.readFileSync("/project/src/app.ts", "utf-8");
    expect(updatedContent).toContain(`from "./components/button"`);
    expect(updatedContent).not.toContain(`from "./components/index"`);
    expect(consoleOutput).toContain("1 files updated");
  });
});