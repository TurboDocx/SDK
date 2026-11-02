import { defineConfig } from 'vitest/config';

// Mirrors the former jest.config.js: node environment, *.test.ts under src/ and tests/,
// Jest-style globals (describe/it/expect without imports), istanbul coverage over src/.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Same isolation model as Jest (child processes, a fresh vm context per test file) and the
    // fastest pool measured on this suite. The memory limit recycles a worker before vm contexts
    // can pile up.
    pool: 'vmForks',
    poolOptions: { vmForks: { memoryLimit: '512MB' } },
    include: ['{src,tests}/**/*.test.ts'],
    // Jest applies its 5s testTimeout to hooks too; Vitest's hook default is 10s.
    hookTimeout: 5000,
    // jest.config.js had verbose: true (one line per test).
    reporters: ['verbose'],
    coverage: {
      provider: 'istanbul',
      // Jest writes the coverage report even when a test fails; Vitest only does with this set.
      reportOnFailure: true,
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/types/**'],
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'html'],
    },
  },
});
