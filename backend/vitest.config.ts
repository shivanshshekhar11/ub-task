import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors the tsconfig path so Vitest resolves the workspace package
      // without needing a compiled build of shared-types.
      '@ub-task/shared-types': path.resolve(__dirname, '../packages/shared-types/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['src/services/**/*.ts', 'src/store/**/*.ts'],
    },
  },
});
