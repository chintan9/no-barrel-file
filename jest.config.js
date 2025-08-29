/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }]
  },
  // ADD THIS LINE: Tells Jest to ignore the dist and node_modules directories when looking for tests.
  testPathIgnorePatterns: ["/node_modules/", "/dist/"]
};
