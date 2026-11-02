import { defineConfig } from 'vitest/config';

// Mirrors the former jest.config.cjs: jsdom environment, *.test.ts and *.test.tsx under src/ and tests/,
// Jest-style globals, istanbul coverage over src/. Vite resolves the sources' ESM ".js" import
// specifiers to the ".ts"/".tsx" files itself, so the Jest moduleNameMapper is not needed.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Same isolation model as Jest (child processes, a fresh vm context per test file) and the
    // fastest pool measured on this suite. The memory limit recycles a worker before vm contexts
    // can pile up.
    pool: 'vmForks',
    poolOptions: { vmForks: { memoryLimit: '512MB' } },
    include: ['{src,tests}/**/*.test.{ts,tsx}'],
    // Jest applies its 5s testTimeout to hooks too; Vitest's hook default is 10s.
    hookTimeout: 5000,
    // jest.config.cjs had verbose: true (one line per test).
    reporters: ['verbose'],
    coverage: {
      provider: 'istanbul',
      // Jest writes the coverage report even when a test fails; Vitest only does with this set.
      reportOnFailure: true,
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.d.ts'],
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'html'],
    },
  },
});
