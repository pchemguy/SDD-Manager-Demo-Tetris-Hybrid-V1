import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for fast deterministic unit and integration checks.
 */
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
