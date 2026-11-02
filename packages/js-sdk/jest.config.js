// Oxlint needs Node ^20.19.0 || >=22.12.0, so its config and ratchet tests are skipped on older Node.
const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
const oxlintRuns = nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 12) || (nodeMajor === 20 && nodeMinor >= 19);

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: oxlintRuns ? ['/node_modules/'] : ['/node_modules/', String.raw`/tests/oxlint-config\.test\.ts$`],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
};
