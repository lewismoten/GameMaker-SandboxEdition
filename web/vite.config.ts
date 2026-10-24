/// <reference types="vitest/config" />
import { defineConfig, type Plugin, type Rollup } from 'vite';
import { resolve } from 'node:path';
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { hashText } from './src/export/serviceWorker';
import { groupKey, groupOf, isHashed, siteWorkerSource } from './src/siteWorker';
import { cdGames, cdSecretCatalog } from './scripts/cdGames';
import { gzipSync } from 'node:zlib';
import { singlePagePlayer } from './scripts/singlePageBuild';
import { hostedPlayer } from './scripts/hostedPlayerBuild';
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
  return readdirSync(dir)
    .filter((f) => !f.startsWith('.'))
    .flatMap((f) => (statSync(resolve(dir, f)).isDirectory() ? publicTree(resolve(dir, f), `${prefix}${f}/`) : [`${prefix}${f}`]));
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

/**
 * The app shell, cached at install: the home page and what it loads up front, the icons and
 * manifest. The play page, like everything else, is cached the first time it is used.
 */
function appShell(bundle: Bundle): string[] {
  const icons = publicFiles().filter((f) => /^(icon|apple-touch-icon).*\.(png|svg)$|\.webmanifest$/.test(f));
  // './' is index.html: fetched once, under the name the browser asks for
  return [...new Set(['./', ...pageGraph(bundle, 'index.html', false).filter((f) => f !== 'index.html'), ...icons])];
}

const TEXT_FILE = /\.(html|js|css|json|svg|txt|xml|webmanifest)$/i;

/**
 * What "Make available offline" downloads (src/offline/offlineCopy.ts): every file of the site
 * but the pictures for link previews and the files for crawlers, with each game as its pack
 * (its own files and their .gz copies are left out) and none of a secret game's (a page that
 * has revealed one adds its pack itself). Each as [path, bytes on the wire, bytes stored]:
 * GitHub Pages gzips text.
 */
function offlineFiles(bundle: Bundle): [string, number, number][] {
  const secret = cdSecretCatalog(resolve(__dirname, '../cd')).map((e) => e.path);
  const sources = new Map<string, () => Uint8Array | string>();
  for (const f of publicTree()) sources.set(f, () => readFileSync(resolve(publicDir, f)));
  for (const [f, item] of Object.entries(bundle)) sources.set(f, () => (item.type === 'chunk' ? item.code : item.source));
  const wanted = (f: string) =>
    !secret.some((dir) => f.startsWith(dir)) &&
    !/^(og\/|og-image\.|robots\.txt$|sitemap\.xml$|llms\.txt$|sw\.js$|index\.html$)/.test(f) &&
    (!/^games\/(gameware|shareware|originals)\//.test(f) || /\.gmpak$|\/walkthrough\.json\.gz$/.test(f));
  return [...sources]
    .filter(([f]) => wanted(f))
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([f, read]) => {
      const data = read();
      const bytes = typeof data === 'string' ? Buffer.from(data) : data;
      return [f, TEXT_FILE.test(f) ? gzipSync(bytes, { level: 6 }).length : bytes.length, bytes.length];
    });
}

/**
 * Emits sw.js, offline.json (offlineFiles), and player-files.json: the files the exporter copies to build a
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
    generateBundle: {
      order: 'post', // and after scripts/seoBuild.ts has made each game's play page from play.html
      handler(_options, bundle) {
        const built = Object.keys(bundle);
        const precache = appShell(bundle);
        const groups = groupHashes(bundle);
        const assets = built.filter(isHashed).sort();
        const version = hashText(JSON.stringify([groups, assets]));
        this.emitFile({ type: 'asset', fileName: 'sw.js', source: siteWorkerSource({ version, precache, groups, assets }) });
        this.emitFile({ type: 'asset', fileName: 'offline.json', source: JSON.stringify({ version, shell: precache, files: offlineFiles(bundle) }) });
        const player = playerGraph(bundle);
        this.emitFile({ type: 'asset', fileName: 'player-files.json', source: JSON.stringify({ version, files: player }) });
      },
    },
  };
}

/** Keeps dotfiles (a Mac's .DS_Store in public/, say) out of the built site. */
function noDotfiles(): Plugin {
  let outDir = '';
  const sweep = (dir: string): void => {
    for (const f of readdirSync(dir)) {
      const p = resolve(dir, f);
      if (f.startsWith('.')) rmSync(p, { recursive: true, force: true });
      else if (statSync(p).isDirectory()) sweep(p);
    }
  };
  return {
    name: 'gamemaker-no-dotfiles',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      if (existsSync(outDir)) sweep(outDir);
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
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- bind() keeps the overloads; the wrapper below needs one plain signature
        const send = channel.send.bind(channel) as (...args: unknown[]) => void;
        channel.send = (...args: unknown[]) => {
          const payload = args[0] as { type?: string; path?: string } | undefined;
          if (payload && typeof payload === 'object' && payload.type === 'full-reload')
            return send({ type: 'custom', event: 'gm:source-changed', data: { file: payload.path ?? '' } });
          return send(...args);
        };
      }
    },
  };
}

/**
 * The play page's code in a few files: each module play.ts loads up front goes in the chunk
 * for exactly the pages that load it that way too ("player" for its own, "shared-web-play"
 * for what today's web also loads before showing anything, …). Left to itself the bundler cut
 * it into a dozen 1-5 kB files the play page waited on. No page loads code it does not use
 * this way; everything else is split as the bundler likes.
 */
function playChunks(): Rollup.GetManualChunk {
  const pages: [name: string, entries: string[]][] = [
    ['main', ['src/main.ts', 'src/seo/route.ts']], // index.html's two scripts
    ['desk', ['src/desk/desk.ts']],
    ['web', ['src/modernUi.ts']],
    ['play', ['src/play.ts']],
    ['dos', ['src/dosPage/dosPage.ts']], // so the DOS page shares the PC's code, not the whole player chunk
  ];
  let closures: Set<string>[] | undefined;
  const closure = (entries: string[], info: Rollup.ManualChunkMeta['getModuleInfo']): Set<string> => {
    const seen = new Set<string>();
    const stack = entries.map((e) => resolve(__dirname, e));
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      stack.push(...(info(id)?.importedIds ?? []));
    }
    return seen;
  };
  return (id, { getModuleInfo }) => {
    closures ??= pages.map(([, entries]) => closure(entries, getModuleInfo));
    if (/\.css($|\?)/.test(id)) return undefined; // styles stay with the code that imports them
    // parts always loaded together, in one file each rather than one per module: the shelf's
    // painted box covers (not a secret game's, covers/extra.ts, which stays apart) and
    // Game-Maker's eight designers (loaded together when Game-Maker starts on the desk's PC)
    if (/\/src\/desk\/boxes\/covers\/(?!extra\.|index\.|paint\.)[\w-]+\.ts$/.test(id)) return 'covers';
    if (/\/src\/vga\/(?!shared\/)/.test(id)) return 'designers';
    // the tin hearts' list and saves: the player reads them, but so do pages that never play
    // (achievements counting hearts at start-up, the desk's trophy), which shouldn't fetch the engine for them
    if (/\/src\/tinHearts\/(tinHearts\.ts|manifest\.ts|hearts\.json)/.test(id)) return 'tinHearts';
    if (pages.some(([, entries]) => entries.some((e) => id === resolve(__dirname, e)))) return undefined; // each page's own chunk
    const users = pages.filter((_, i) => closures![i].has(id)).map(([name]) => name);
    if (!users.includes('play') || users.includes('main')) return undefined;
    return users.length === 1 ? 'player' : `shared-${users.join('-')}`;
  };
}

// Relative base so the build works at https://<user>.github.io/<repo>/ and from any folder.
export default defineConfig({
  base: './',
  plugins: [
    cdGames(resolve(__dirname, '../cd')),
    seoPages(resolve(__dirname, '../cd')),
    singlePagePlayer(),
    hostedPlayer(),
    offline(),
    noDotfiles(),
    manualReload(),
  ],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        play: resolve(__dirname, 'play.html'),
        dos: resolve(__dirname, 'dos.html'), // the PC on its own (src/dosPage)
      },
      output: { manualChunks: playChunks(), onlyExplicitManualChunks: true },
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
