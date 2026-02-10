import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: ['src/engine/**', 'src/store/**', 'src/components/**', 'src/hooks/**', 'src/lib/**'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test-setup.ts', 'src/data/**'],
      thresholds: {
        statements: 60,
        branches: 45,
        functions: 60,
        lines: 60,
      },
    },
  },
});
