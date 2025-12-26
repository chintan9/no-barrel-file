import * as core from '@actions/core';
import { program } from './index'; // Import your existing CLI program

async function run() {
  try {
    // 1. Get Inputs from GitHub Action usage
    const rootPath = core.getInput('root-path') || process.cwd();
    const extensions = core.getInput('extensions') || '.ts,.js,.tsx,.jsx';
    const ignorePaths = core.getInput('ignore-paths') || '';
    const mode = core.getInput('mode') || 'display'; // 'count', 'display', or 'replace'
    const aliasConfig = core.getInput('alias-config-path'); // Required for replace

    // 2. Construct Arguments for your Commander program
    // We emulate process.argv array: ['node', 'script', command, ...flags]
    const args = ['node', 'no-barrel-file', mode];

    args.push('--root-path', rootPath);
    args.push('--extensions', extensions);
    if (ignorePaths) args.push('--ignore-paths', ignorePaths);
    
    // Specific requirements for replace command
    if (mode === 'replace') {
      if (!aliasConfig) {
        throw new Error("Input 'alias-config-path' is required when mode is 'replace'");
      }
      args.push('--alias-config-path', aliasConfig);
    }

    // 3. execute the program
    // We need to await the parseAsync method
    console.log(`Running no-barrel-file in ${mode} mode...`);
    await program.parseAsync(args);

    if (mode === 'replace') {
      core.info('Barrel files replaced. Check for modified files.');
    }

  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();