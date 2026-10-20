/**
 * Jest config for the live E2E test bed (separate from unit tests so `npm test` stays hermetic).
 * Run: `npm run test:e2e` with the E2E_* env vars set (see e2e/*.e2e.test.ts headers).
 */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/e2e'],
  testMatch: ['**/*.e2e.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
};
