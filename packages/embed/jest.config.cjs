/** @type {import('ts-jest').JestConfigWithTsJest} */
// CommonJS config file (".cjs") because package.json sets "type": "module", and jest loads
// its config through Node's require, which rejects a "module.exports" file named ".js".
module.exports = {
  preset: 'ts-jest',
  // Build tsconfig targets browser ESM (module: node16 + "type":"module"). For jest, compile the same
  // sources to CommonJS so the jest runtime can require them. This also silences the ts-jest
  // hybrid-module warning (TS151002) without touching the build config.
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', jsx: 'react-jsx' } }],
  },
  // The web component and React tests need a DOM; the pure handler runs fine here too.
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  // Match both .test.ts (handler, web component) and .test.tsx (React) so no file is silently skipped.
  testMatch: ['**/*.test.ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Source uses ESM-style relative imports with explicit ".js" extensions (required for browser ESM).
  // ts-jest transpiles to CommonJS for jest, so strip the ".js" so jest resolves the ".ts"/".tsx" file.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: ['src/**/*.ts', 'src/**/*.tsx', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
};
