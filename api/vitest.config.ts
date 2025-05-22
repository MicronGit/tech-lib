import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      './test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
      './src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
