/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { serviceWorkerSource, hashText } from './src/export/serviceWorker';

const publicDir = resolve(__dirname, 'public');

/** Top-level public files (sample game folders are cached on demand, not precached). */
function publicFiles(): string[] {
  if (!existsSync(publicDir)) return [];
  const out = readdirSync(publicDir).filter((f) => statSync(resolve(publicDir, f)).isFile());
  if (existsSync(resolve(publicDir, 'games/index.json'))) out.push('games/index.json');
  return out;
}

/**
 * Emits sw.js for offline use of the whole site, and player-files.json: the files
 * the exporter copies to build a stand-alone game web app.
 */
function offline(): Plugin {
  return {
    name: 'gamemaker-offline',
    apply: 'build',
    enforce: 'post', // after Vite's HTML plugin has emitted the pages
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle);
      const precache = [...new Set(['./', ...built, ...publicFiles()])].filter((f) => f !== 'sw.js');
      const version = hashText(built.sort().join('|'));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: serviceWorkerSource(version, precache) });
      const player = built.filter((f) => f === 'play.html' || f.startsWith('assets/'));
      this.emitFile({ type: 'asset', fileName: 'player-files.json', source: JSON.stringify({ version, files: player }) });
    },
  };
}

// Relative base so the build works at https://<user>.github.io/<repo>/ and from any folder.
export default defineConfig({
  base: './',
  plugins: [offline()],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        play: resolve(__dirname, 'play.html'),
      },
    },
  },
  worker: {
    format: 'es',
  },
  test: {
    environment: 'node',
  },
});
