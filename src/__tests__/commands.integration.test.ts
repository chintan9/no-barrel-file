const { vol } = require("memfs");
import fg from "fast-glob";
import { program } from "../index";
import path from "path";

// Mocking the file system
jest.mock("fs", () => require("memfs").fs);
jest.mock("fs/promises", () => require("memfs").fs.promises);
jest.mock("fast-glob");

const mockedFg = fg as unknown as jest.Mock;

let consoleOutput: any[];
const mockedLog = (output: any) => consoleOutput.push(output);

// Helper to create absolute paths for the mock filesystem that work on Windows/Linux
const root = process.platform === 'win32' ? 'C:\\project' : '/project';
const toPosix = (p: string) => p.replace(/\\/g, '/');

describe("CLI Commands (Integration)", () => {
  beforeEach(() => {
    vol.reset();
    mockedFg.mockClear();
    consoleOutput = [];
    jest.spyOn(console, "log").mockImplementation(mockedLog);
    jest.spyOn(console, "error").mockImplementation(mockedLog);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should count the barrel files correctly", async () => {
    const file1 = path.join(root, "src/components/index.ts");
    const file2 = path.join(root, "src/utils/index.ts");
    
    vol.fromJSON({
      [file1]: `export * from './button';`,
      [file2]: `export const util = {};`
    });
    
    mockedFg.mockResolvedValue([file1, file2]);

    const argv = ["node", "no-barrel-file", "count", "--root-path", root, "--extensions", ".ts"];
    await program.parseAsync(argv);

    expect(consoleOutput).toContain(1);
  });

  it("should display the barrel files correctly", async () => {
    const file1 = path.join(root, "src/components/index.ts");
    vol.fromJSON({ [file1]: `export * from './button';` });
    mockedFg.mockResolvedValue([file1]);

    const argv = ["node", "no-barrel-file", "display", "--root-path", root, "--extensions", ".ts"];
    await program.parseAsync(argv);

    expect(consoleOutput).toContain("1 barrel files found");
    // Asserting against normalized POSIX path
    expect(consoleOutput).toContain("src/components/index.ts");
  });

  it("should replace barrel imports with direct paths", async () => {
    const tsconfig = path.join(root, "tsconfig.json");
    const button = path.join(root, "src/components/button.ts");
    const index = path.join(root, "src/components/index.ts");
    const app = path.join(root, "src/app.ts");

    vol.fromJSON({
      [button]: `export const Button = {};`,
      [index]: `export * from './button';`,
      [app]: `import { Button } from './components/index';`,
      [tsconfig]: JSON.stringify({
        compilerOptions: { baseUrl: ".", paths: { "*": ["src/*"] } }
      })
    });

    const argv = ["node", "no-barrel-file", "replace", "--root-path", root, "--alias-config-path", "tsconfig.json"];
    
    await program.parseAsync(argv);

    const updatedContent = vol.readFileSync(app, "utf-8");
    expect(toPosix(updatedContent)).toContain(`from "./components/button"`);
    expect(consoleOutput).toContain("1 files updated");
  });
});