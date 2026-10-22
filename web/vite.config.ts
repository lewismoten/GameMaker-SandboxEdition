/// <reference types="vitest/config" />
import { defineConfig, type Plugin, type Rollup } from 'vite';
import { resolve } from 'node:path';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { hashText } from './src/export/serviceWorker';
import { groupKey, groupOf, isHashed, siteWorkerSource } from './src/siteWorker';
import { cdGames } from './scripts/cdGames';
import { singlePagePlayer } from './scripts/singlePageBuild';
import { seoPages } from './scripts/seoBuild';

const publicDir = resolve(__dirname, 'public');

/** Top-level public files (icons, manifest). */
function publicFiles(): string[] {
  if (!existsSync(publicDir)) return [];
  return readdirSync(publicDir).filter((f) => statSync(resolve(publicDir, f)).isFile());
}

type Bundle = Rollup.OutputBundle;

/**
 * A page plus every chunk, stylesheet and asset reachable from it. With `lazy` false only
 * what the page loads up front (static imports): not the chunks it imports on demand, nor
 * files a chunk merely names (such as the audio worklet).
 */
function pageGraph(bundle: Bundle, page: string, lazy = true): string[] {
  const out = new Set<string>([page]);
  const html = bundle[page];
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
      queue.push(...item.imports);
      if (lazy) queue.push(...item.dynamicImports);
      const meta = (item as unknown as { viteMetadata?: { importedCss: Set<string>; importedAssets: Set<string> } }).viteMetadata;
      if (meta) queue.push(...meta.importedCss, ...meta.importedAssets);
      if (lazy) mention(item.code); // e.g. the audio worklet, referenced by URL
    } else if (item?.type === 'asset' && f.endsWith('.css')) mention(String(item.source));
  }
  return [...out].sort();
}

/** play.html plus everything it can load: what an exported game web app needs. */
const playerGraph = (bundle: Bundle) => pageGraph(bundle, 'play.html');

/** Every file under the public folder (copied into the site as is), relative to it. */
function publicTree(dir = publicDir, prefix = ''): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => !f.startsWith('.')).flatMap((f) => (statSync(resolve(dir, f)).isDirectory() ? publicTree(resolve(dir, f), `${prefix}${f}/`) : [`${prefix}${f}`]));
}

const digest = (data: string | Uint8Array) => createHash('sha1').update(data).digest('base64url').slice(0, 12);

/**
 * The content hash of each group of files the service worker versions together (siteWorker.ts
 * groupOf: a game's folder, the desk's pictures, each page): the worker keeps a group's cached
 * files from one deploy to the next while its hash stays the same.
 */
function groupHashes(bundle: Bundle): Record<string, string> {
  const files = new Map<string, string>();
  for (const f of publicTree()) files.set(f, digest(readFileSync(resolve(publicDir, f))));
  for (const [f, item] of Object.entries(bundle)) files.set(f, digest(item.type === 'chunk' ? item.code : item.source));
  const groups = new Map<string, string[]>();
  for (const [f, h] of [...files].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const g = groupOf(f);
    if (g === undefined || f === 'sw.js') continue;
    groups.set(g, [...(groups.get(g) ?? []), `${f}:${h}`]);
  }
  return Object.fromEntries([...groups].map(([g, lines]) => [groupKey(g), digest(lines.join('\n'))]));
}

/** The app shell, cached at install: the two pages and what they load up front, the icons and manifest. */
function appShell(bundle: Bundle): string[] {
  const icons = publicFiles().filter((f) => /^(icon|apple-touch-icon).*\.(png|svg)$|\.webmanifest$/.test(f));
  return [...new Set(['./', ...pageGraph(bundle, 'index.html', false), ...pageGraph(bundle, 'play.html', false), ...icons])];
}

/**
 * Emits sw.js, and player-files.json: the files the exporter copies to build a
 * stand-alone game web app.
 *
 * The service worker installs only the app shell, so a first visit downloads nothing it
 * does not show. Everything else (the desk or today's web, the editors, games, the guide)
 * is cached the first time it is used and works offline from then on; a deploy drops only
 * the cached files that changed (src/siteWorker.ts).
 */
function offline(): Plugin {
  return {
    name: 'gamemaker-offline',
    apply: 'build',
    enforce: 'post', // after Vite's HTML plugin has emitted the pages
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle);
      const precache = appShell(bundle);
      const groups = groupHashes(bundle);
      const assets = built.filter(isHashed).sort();
      const version = hashText(JSON.stringify([groups, assets]));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: siteWorkerSource({ version, precache, groups, assets }) });
      const player = playerGraph(bundle);
      this.emitFile({ type: 'asset', fileName: 'player-files.json', source: JSON.stringify({ version, files: player }) });
    },
  };
}

/**
 * Development: don't hot-reload the page when a source file changes (it would switch
 * off the retro PC); tell the page instead, which offers a Reload button.
 */
function manualReload(): Plugin {
  return {
    name: 'gamemaker-manual-reload',
    apply: 'serve',
    handleHotUpdate({ server, file }) {
      server.ws.send({ type: 'custom', event: 'gm:source-changed', data: { file } });
      return [];
    },
    // New or deleted files (e.g. a module matched by import.meta.glob) make Vite send a
    // full reload directly; turn those into the same "ready to reload" notice.
    configureServer(server) {
      const channels = new Set([server.ws, server.environments?.client?.hot].filter((c) => !!c));
      for (const channel of channels) {
        const send = channel.send.bind(channel) as (...args: unknown[]) => void;
        channel.send = ((...args: unknown[]) => {
          const payload = args[0] as { type?: string; path?: string } | undefined;
          if (payload && typeof payload === 'object' && payload.type === 'full-reload')
            return send({ type: 'custom', event: 'gm:source-changed', data: { file: payload.path ?? '' } });
          return send(...args);
        }) as typeof channel.send;
      }
    },
  };
}

// Relative base so the build works at https://<user>.github.io/<repo>/ and from any folder.
export default defineConfig({
  base: './',
  plugins: [cdGames(resolve(__dirname, '../cd')), seoPages(resolve(__dirname, '../cd')), singlePagePlayer(), offline(), manualReload()],
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
  server: {
    // Editing this config or the build-time plugins in scripts/ would restart the dev
    // server, and Vite's client then reloads every open page (switching off the desk PC
    // mid-session). Don't watch them: restart the dev server by hand to pick them up.
    watch: { ignored: ['**/vite.config.ts', '**/scripts/**'] },
  },
  test: {
    environment: 'node',
  },
});
