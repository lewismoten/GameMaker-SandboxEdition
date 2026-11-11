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
import { escapeHtml, metaTags, OG_IMAGE, OG_IMAGE_ALT, SITE_URL } from '../src/seo/site';
import { PRODUCT } from '../src/edition';

const root = resolve(__dirname, '..');
const ENTRY = resolve(root, 'src/hostedPlayer/main.ts');

/** The two copies of the page each have their own words and address (the download is the one to find). */
const PAGES = {
  download: {
    file: 'web-player.html',
    title: `Web player for old Game-Maker games · ${PRODUCT}`,
    h1: 'Game-Maker web player',
    description:
      'A single web page that plays old Game-Maker DOS games from the folders beside it, in any browser, with saves and high scores kept on the visitor’s device. Free to download and put on a web host (MIT License).',
  },
  try: {
    file: 'player/index.html',
    title: `Try the web player with this site’s games · ${PRODUCT}`,
    h1: 'Game-Maker web player: this site’s games',
    description:
      'The web player running on this site with its games listed: pick one and play it in the page. The same file is offered for download as web-player.html.',
  },
} as const;

function headTags(page: keyof typeof PAGES): string {
  const p = PAGES[page];
  const meta = metaTags({
    title: p.title,
    description: p.description,
    url: `${SITE_URL}${p.file}`,
    image: OG_IMAGE,
    imageAlt: OG_IMAGE_ALT,
  });
  return `<title>${escapeHtml(p.title)}</title>\n${meta}`;
}

async function buildHostedPlayer(page: keyof typeof PAGES = 'download', bundled?: ReturnType<typeof bundleOnePage>): Promise<string> {
  const { script, style } = await (bundled ?? bundleOnePage(ENTRY));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light dark" />
${headTags(page)}
<style>${style}</style>
</head>
<body class="wp-body">
<div id="wp-root"><noscript><h1>${escapeHtml(PAGES[page].h1)}</h1><p>The Game-Maker web player needs JavaScript to play the games.</p></noscript></div>
<script>${script}</script>
</body>
</html>
`;
}

/** games.json for player/: the catalog's games, in its order, folders relative to player/. */
function siteGameList(catalog: CdCatalogEntry[]): string {
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
        const bundled = bundleOnePage(ENTRY);
        const html = await buildHostedPlayer('download', bundled);
        this.emitFile({ type: 'asset', fileName: 'web-player.html', source: html });
        // The copy to try on this site is kept out of search results (it repeats web-player.html, which is the download and stays byte for byte as offered).
        this.emitFile({
          type: 'asset',
          fileName: 'player/index.html',
          source: (await buildHostedPlayer('try', bundled)).replace('<title>', '<meta name="robots" content="noindex" />\n<title>'),
        });
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
