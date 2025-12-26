"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const index_1 = require("./index"); // Import your existing CLI program
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
        if (ignorePaths)
            args.push('--ignore-paths', ignorePaths);
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
        await index_1.program.parseAsync(args);
        if (mode === 'replace') {
            core.info('Barrel files replaced. Check for modified files.');
        }
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
