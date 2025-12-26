
# 🚫 No Barrel File

[![npm version](https://img.shields.io/npm/v/no-barrel-file.svg?style=flat-square)](https://www.npmjs.com/package/no-barrel-file)
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/chintan9/no-barrel-file/CI.yml?style=flat-square)](https://github.com/chintan9/no-barrel-file/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

> **Eliminate barrel file imports to boost tree-shaking, reduce bundle size, and speed up test performance.**

**No Barrel File** is a CLI tool and GitHub Action that detects imports from barrel files (files that just re-export other modules) and automatically replaces them with direct file paths.

---

## 🧐 Why?

Barrel files (`index.ts` exporting everything) are convenient but costly.
1.  **Tree-Shaking Failures:** Tools like Webpack and Rollup often struggle to tree-shake barrel files effectively, including dead code in your bundle.
2.  **Slow Tests:** In Jest/Vitest, importing one named export from a barrel file often loads *every* exported module in that barrel, significantly slowing down startup time.
3.  **Circular Dependencies:** Barrel files are the #1 cause of "Module undefined" circular dependency errors.

### The Transformation

**Before** (Imports everything in `./utils`):
```typescript
import { formatDate } from './utils';
```

**After** (Imports only what is needed):
```typescript
import { formatDate } from './utils/date-formatter';
```

---

## 🚀 GitHub Action (Recommended)

You can run this tool automatically in your CI/CD pipeline to detect or fix barrel imports.

### 1. Auto-Fix Workflow (Best for lazy maintenance)
Create a workflow `.github/workflows/fix-barrels.yml` to automatically fix imports and commit the changes to your PRs.

```yaml
name: Auto-Fix Barrel Files
on: [pull_request]

permissions:
  contents: write # Required to commit changes

jobs:
  fix-imports:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run No Barrel File
        uses: chintan9/no-barrel-file@v1
        with:
          mode: 'replace'
          alias-config-path: 'tsconfig.json' # Required for 'replace' mode
          extensions: '.ts,.tsx'
      
      - name: Commit changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "refactor: resolve barrel file imports"
```

### 2. Check-Only Workflow (Best for strict enforcement)
Fail the build if developers use barrel imports.

```yaml
steps:
  - uses: actions/checkout@v4
  
  - name: Check for barrel files
    uses: chintan9/no-barrel-file@v1
    with:
      mode: 'display' # Will list files but not modify them
```

### Action Inputs

| Input | Description | Default | Required? |
| :--- | :--- | :--- | :--- |
| `mode` | Operation mode: `count`, `display`, or `replace` | `display` | No |
| `alias-config-path` | Path to `tsconfig.json` (Required for resolving paths in `replace` mode) | - | **Yes (for replace)** |
| `root-path` | Root directory of the project | `.` | No |
| `extensions` | File extensions to scan | `.ts,.js,.tsx,.jsx` | No |
| `ignore-paths` | Comma-separated list of folders to ignore | - | No |

---

## 💻 CLI Usage

You can also use the tool locally via your terminal.

### Installation

```bash
# Install globally
npm install -g no-barrel-file

# Or run via npx
npx no-barrel-file --help
```

### Commands

#### 1. Display Barrel Files
Lists all files in your project that are acting as barrel files (index files exporting other modules).

```bash
npx no-barrel-file display
```

#### 2. Replace Imports (The Magic ✨)
Automatically rewrites imports in your code to point directly to the source file instead of the barrel file.

> **Note:** This requires your `tsconfig.json` to resolve paths correctly.

```bash
npx no-barrel-file replace --alias-config-path tsconfig.json
```

#### 3. Count
Just returns the number of barrel files found (useful for scripts).

```bash
npx no-barrel-file count
```

### CLI Options

| Flag | Alias | Description | Default |
| :--- | :--- | :--- | :--- |
| `--root-path` | `-r` | Root path of the project | Current Directory |
| `--extensions` | `-e` | File extensions to process | `.ts,.js,.tsx,.jsx` |
| `--ignore-paths` | `-i` | Comma-separated paths to ignore | - |
| `--gitignore-path`| `-g` | Path to .gitignore file | `.gitignore` |
| `--alias-config-path` | `-a` | Path to tsconfig.json (Replace mode only) | - |

---

## 🛠️ Configuration & ignoring files

**No Barrel File** automatically respects your `.gitignore` file. 

If you want to ignore specific folders manually (like legacy code or tests), use the `--ignore-paths` flag:

```bash
npx no-barrel-file display --ignore-paths "src/legacy,src/__tests__"
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/chintan9">chintan9</a></sub>
</div>
```