module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.', // This should be your project root
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$', // This targets your unit test files
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    // Map 'src' aliases to actual paths
    '^src/(.*)$': '<rootDir>/src/$1',
    // Map 'generated/prisma' to its actual path
    '^generated/prisma(|/.*)$': '<rootDir>/generated/prisma/$1',
  },
  // Coverage settings merged from package.json
  collectCoverageFrom: [
    '<rootDir>/src/**/*.(t|j)s', // Adjusted to collect from 'src' relative to project root
  ],
  coverageDirectory: 'coverage', // Adjusted to be 'coverage' folder at project root
  // Optional: If you want to ignore the e2e test directory for unit tests
  testPathIgnorePatterns: ['<rootDir>/test/'],
};
