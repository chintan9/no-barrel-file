/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Use the ts-jest preset
  preset: "ts-jest",
  // The environment in which the tests should be run
  testEnvironment: "node",
  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        // ts-jest configuration goes here
        tsconfig: "tsconfig.json"
      }
    ]
  }
};
