// Builds the web player (src/hostedPlayer, docs/web-player.md): one .html file with the engine,
// styles and music worklet inside, to put beside old Game-Maker game folders on any web host.
//
//   web-player.html     the file the site offers to download
//   player/index.html   the same page, to try on this site,
//   player/games.json   with a list of the site's own games (games/index.json, so never a
//                       secret one): this project's new games by their .gam alone (the player
//                       finds the rest, as it must for a host's folders), the CD's with their
//                       file lists (their CD names, such as A_J.BKD, are not what the .gam says)
//
// The dev server builds the page on demand at /web-player.html and /player/ (with no
// games.json there, so it shows its how-to).
import { type Plugin } from 'vite';
import { resolve } from 'node:path';
import { bundleOnePage } from './singlePageBuild';
import type { CdCatalogEntry } from './cdGames';

const root = resolve(__dirname, '..');
const ENTRY = resolve(root, 'src/hostedPlayer/main.ts');

export async function buildHostedPlayer(): Promise<string> {
  const { script, style } = await bundleOnePage(ENTRY);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light dark" />
<title>Game-Maker web player</title>
<meta name="description" content="Plays Game-Maker DOS games from the folders beside this page, in the browser. Made with Game-Maker: Sandbox Edition (MIT License)." />
<style>${style}</style>
</head>
<body class="wp-body">
<div id="wp-root"><noscript>The Game-Maker web player needs JavaScript to play the games.</noscript></div>
<script>${script}</script>
</body>
</html>
`;
}

/** games.json for player/: the catalog's games, in its order, folders relative to player/. */
export function siteGameList(catalog: CdCatalogEntry[]): string {
  const games = catalog
    .filter((e) => e.gam)
    .map((e) => {
      const author = e.author ?? e.company;
      return {
        id: e.id,
        title: e.title,
        folder: `../${e.path}`,
        gam: e.gam,
        ...(e.original ? {} : { files: e.files }),
        ...(author ? { author } : {}),
        ...(e.year ? { year: e.year } : {}),
      };
    });
  return `${JSON.stringify({ title: 'Game-Maker: Sandbox Edition games', games }, null, 1)}\n`;
}

export function hostedPlayer(): Plugin {
  let cached: Promise<string> | undefined;
  let command: 'build' | 'serve' = 'serve';
  return {
    name: 'gamemaker-hosted-player',
    configResolved(config) {
      command = config.command;
    },
    // After scripts/cdGames.ts has put games/index.json in the bundle.
    generateBundle: {
      order: 'post',
      async handler(_options, bundle) {
        if (command !== 'build') return;
        const html = await buildHostedPlayer();
        this.emitFile({ type: 'asset', fileName: 'web-player.html', source: html });
        this.emitFile({ type: 'asset', fileName: 'player/index.html', source: html });
        const index = bundle['games/index.json'];
        const catalog = index?.type === 'asset' ? (JSON.parse(String(index.source)) as CdCatalogEntry[]) : [];
        this.emitFile({ type: 'asset', fileName: 'player/games.json', source: siteGameList(catalog) });
      },
    },
    configureServer(server) {
      server.watcher.on('all', (_event, file) => {
        if (file.startsWith(resolve(root, 'src'))) cached = undefined;
      });
      const send = (res: import('node:http').ServerResponse) => {
        cached ??= buildHostedPlayer();
        cached.then(
          (html) => {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(html);
          },
          (e: Error) => {
            cached = undefined;
            res.statusCode = 500;
            res.end(`Could not build the web player: ${e.message}`);
          },
        );
      };
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        if (path === '/web-player.html' || path === '/player/' || path === '/player/index.html') return send(res);
        next();
      });
    },
  };
}
