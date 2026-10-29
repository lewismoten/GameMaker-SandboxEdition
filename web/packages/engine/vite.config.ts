// Build only the reusable engine and its audio worklet, independently of the site's build.
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  publicDir: false,
  build: {
    target: 'es2022',
    emptyOutDir: true,
    outDir: resolve(__dirname, 'dist'),
    lib: {
      entry: resolve(__dirname, '../../src/engine/package.ts'),
      formats: ['es'],
      fileName: () => 'engine.js',
    },
  },
  worker: { format: 'es' },
});
