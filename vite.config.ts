import { defineConfig } from 'vite';

/**
 * Vite configuration for the browser Tetris application.
 * Uses relative asset paths ('./') so the static production bundle
 * loads cleanly at both root and subdirectory HTTP paths (R12).
 */
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
});
