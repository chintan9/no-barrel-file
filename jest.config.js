/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Use ts-jest preset to handle TypeScript files
  preset: "ts-jest",
  
  // Set the test environment to Node.js (suitable for CLI tools)
  testEnvironment: "node",
  
  // Define where Jest should look for test files
  roots: ["<rootDir>/src"],
  
  // Pattern to match test files
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/?(*.)+(spec|test).ts"
  ],

  // Transform settings for TypeScript
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }]
  },

  // Important: Ignore the dist and node_modules directories to avoid 
  // picking up compiled files or dependencies.
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/"
  ],

  // Ensure coverage is collected from the correct source files
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/__tests__/**"
  ]
};