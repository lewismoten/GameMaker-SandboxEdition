/// <reference types="vitest/config" />
import { defineConfig, type Plugin, type Rollup } from 'vite';
import { resolve } from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { serviceWorkerSource, hashText } from './src/export/serviceWorker';
import { cdGames } from './scripts/cdGames';

const publicDir = resolve(__dirname, 'public');

/** Top-level public files (icons, manifest). */
function publicFiles(): string[] {
  if (!existsSync(publicDir)) return [];
  return readdirSync(publicDir).filter((f) => statSync(resolve(publicDir, f)).isFile());
}

/** Game folders are cached when a game is first played, not at install. */
const precacheable = (f: string) => f !== 'sw.js' && (!f.startsWith('games/') || f === 'games/index.json');

type Bundle = Rollup.OutputBundle;

/** play.html plus every chunk, stylesheet and asset reachable from it. */
function playerGraph(bundle: Bundle): string[] {
  const out = new Set<string>(['play.html']);
  const html = bundle['play.html'];
  const queue: string[] = [];
  const mention = (text: string) => {
    for (const f of Object.keys(bundle)) if (!out.has(f) && f.startsWith('assets/') && text.includes(f.slice('assets/'.length))) queue.push(f);
  };
  if (html?.type === 'asset') mention(String(html.source));
  while (queue.length) {
    const f = queue.pop()!;
    if (out.has(f)) continue;
    out.add(f);
    const item = bundle[f];
    if (item?.type === 'chunk') {
      queue.push(...item.imports, ...item.dynamicImports);
      const meta = (item as unknown as { viteMetadata?: { importedCss: Set<string>; importedAssets: Set<string> } }).viteMetadata;
      if (meta) queue.push(...meta.importedCss, ...meta.importedAssets);
      mention(item.code); // e.g. the audio worklet, referenced by URL
    } else if (item?.type === 'asset' && f.endsWith('.css')) mention(String(item.source));
  }
  return [...out].sort();
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
      const precache = [...new Set(['./', ...built, ...publicFiles()])].filter(precacheable);
      const version = hashText(built.sort().join('|'));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: serviceWorkerSource(version, precache) });
      const player = playerGraph(bundle);
      this.emitFile({ type: 'asset', fileName: 'player-files.json', source: JSON.stringify({ version, files: player }) });
    },
  };
}

// Relative base so the build works at https://<user>.github.io/<repo>/ and from any folder.
export default defineConfig({
  base: './',
  plugins: [cdGames(resolve(__dirname, '../cd')), offline()],
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
