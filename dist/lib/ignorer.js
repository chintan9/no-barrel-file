"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ignorer = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const ignore_1 = __importDefault(require("ignore"));
class Ignorer {
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.ig = (0, ignore_1.default)();
    }
    static async create(rootPath, ignorePaths, gitIgnorePath) {
        const instance = new Ignorer(rootPath);
        await instance.loadGitignore(gitIgnorePath);
        instance.addManualIgnores(ignorePaths);
        return instance;
    }
    async loadGitignore(gitIgnorePath) {
        try {
            const fullPath = path_1.default.resolve(this.rootPath, gitIgnorePath);
            const content = await promises_1.default.readFile(fullPath, "utf-8");
            this.ig.add(content);
        }
        catch (error) {
            // Skip if .gitignore doesn't exist
        }
    }
    addManualIgnores(ignorePaths) {
        if (ignorePaths && ignorePaths.length > 0) {
            const validPaths = ignorePaths
                .map((p) => p.trim())
                .filter((p) => p.length > 0);
            this.ig.add(validPaths);
        }
    }
    ignores(filePath) {
        const relativePath = path_1.default.relative(this.rootPath, filePath);
        if (!relativePath)
            return false;
        // FIX: Normalize backslashes to forward slashes for the 'ignore' library
        const posixPath = relativePath.replace(/\\/g, '/');
        return this.ig.ignores(posixPath);
    }
}
exports.Ignorer = Ignorer;
