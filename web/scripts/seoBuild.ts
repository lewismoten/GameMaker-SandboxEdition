// Search engines and link previews mostly don't run the app, so the pages carry what they
// need as static HTML: meta/Open Graph/Twitter tags, schema.org JSON-LD for the app and
// every bundled game, and readable text with links (shown until the app starts, and to
// browsers without JavaScript). The build also writes robots.txt, sitemap.xml and
// llms.txt (https://llmstxt.org), which the dev server serves too.
//
// index.html, play.html and dos.html mark where it goes with <!--SEO:HEAD--> and <!--SEO:BODY-->.
//
// Every bundled game also gets its own play page, play-<id>.html next to play.html (made
// from the built play.html, so it loads the same player), with the game's title,
// description, canonical address, tags, JSON-LD and text baked in, and a preview picture
// og/<id>.png (scripts/ogImage.ts): link previews (Slack, Discord, X, Facebook) don't run
// scripts, so play.html?game=<id> can only show the generic player's tags.
import type { IndexHtmlTransformContext, Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cdCatalog, cdFiles, type CdCatalogEntry } from './cdGames';
import { gameCardPng } from './ogImage';
import {
  appJsonLd,
  clip,
  escapeHtml,
  GAME_IMAGE_SIZE,
  gameDescription,
  gameImagePath,
  gameJsonLd,
  gamePage,
  jsonLdScript,
  metaTags,
  OG_IMAGE,
  OG_IMAGE_ALT,
  playUrl,
  REPO_URL,
  repoJsonLd,
  ROUTES,
  scriptJson,
  SITE_ABOUT,
  SITE_URL,
} from '../src/seo/site';
import { FORK_NOTE, NOTICE_URL, PRODUCT } from '../src/edition';
import { hasBizarreTab, isBizarreGame } from '../src/project/bizarre';

export const HEAD_MARK = '<!--SEO:HEAD-->';
export const BODY_MARK = '<!--SEO:BODY-->';
// Around what the marks became in play.html, so a game's page can swap in its own.
const HEAD_START = '<!--seo:head-->';
const HEAD_END = '<!--/seo:head-->';
const BODY_START = '<!--seo:body-->';
const BODY_END = '<!--/seo:body-->';

const playable = (catalog: CdCatalogEntry[]) => catalog.filter((g) => g.gam);
const credit = (g: CdCatalogEntry) => [g.author ?? g.company, g.year].filter(Boolean).join(', ');
const imageUrl = (g: CdCatalogEntry) => `${SITE_URL}${gameImagePath(g.id)}`;
const pageTitle = (g: CdCatalogEntry) => `${g.title} · play in your browser · ${PRODUCT}`;
const pageHref = (g: CdCatalogEntry) => `./${gamePage(g.id)}`;

function groups(catalog: CdCatalogEntry[]): [string, string, CdCatalogEntry[]][] {
  const games = playable(catalog);
  // The Bard of Bizarre's games: a group of their own once there are enough (src/project/bizarre.ts)
  const bizarre = hasBizarreTab(games) ? games.filter(isBizarreGame) : [];
  return [
    ['New games', 'Made for this project with Game-Maker, released as shareware.', games.filter((g) => g.original && !bizarre.includes(g))],
    ['Bizarre', 'Songs by The Bard of Bizarre (Lewis Moten as his hobo clown Doc Leo), turned into games.', bizarre],
    [
      'Sample games',
      'The free games that came with Game-Maker 3.0 — open them in the editor to see how they work.',
      games.filter((g) => g.kind === 'gameware'),
    ],
    [
      'Shareware',
      'Games people made with Game-Maker in the 90s, played with their authors’ notices.',
      games.filter((g) => g.kind === 'shareware' && !g.original),
    ],
  ];
}

function gameList(catalog: CdCatalogEntry[], href: (g: CdCatalogEntry) => string): string {
  return groups(catalog)
    .filter(([, , games]) => games.length)
    .map(
      ([head, about, games]) => `<section>
        <h2>${escapeHtml(head)}</h2>
        <p>${escapeHtml(about)}</p>
        <ul>
${games
  .map(
    (g) =>
      `          <li id="game-${escapeHtml(g.id)}"><a href="${escapeHtml(href(g))}">${escapeHtml(g.title)}</a>${credit(g) ? ` <small>(${escapeHtml(credit(g))})</small>` : ''}${g.blurb ? ` — ${escapeHtml(clip(g.blurb, 160))}` : ''}</li>`,
  )
  .join('\n')}
        </ul>
      </section>`,
    )
    .join('\n      ');
}

const STYLE = `<style>
      .seo-static { box-sizing: border-box; min-height: 100vh; margin: 0; padding: 24px max(16px, calc((100% - 46rem) / 2)) 48px; background: #12122a; font: 16px/1.5 system-ui, sans-serif; color: #e8e8f0; }
      .seo-static a { color: #9cf; }
      .seo-static h1 { font: bold 1.8rem monospace; letter-spacing: 2px; color: #ff5; margin: 0 0 4px; }
      .seo-static h2 { font: bold 1.15rem monospace; color: #5f5; margin: 24px 0 4px; }
      .seo-static small { color: #aab; }
      .seo-static ul { padding-left: 1.2rem; }
      .seo-static .seo-note { color: #aab; font-size: 0.9rem; }
    </style>`;

/**
 * The home page's structured data: the app, its source, and the games as a list of their own
 * pages (each page carries the game's full JSON-LD, gameHead), which keeps index.html small.
 */
function siteNodes(catalog: CdCatalogEntry[]): Record<string, unknown>[] {
  const games = playable(catalog);
  return [
    appJsonLd(),
    repoJsonLd(),
    {
      '@type': 'ItemList',
      '@id': `${SITE_URL}#games`,
      name: `Games you can play with ${PRODUCT}`,
      numberOfItems: games.length,
      itemListElement: games.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: playUrl(g.id), name: g.title })),
    },
  ];
}

function indexHead(catalog: CdCatalogEntry[]): string {
  const meta = metaTags({ ...ROUTES.home, url: SITE_URL, image: OG_IMAGE, imageAlt: OG_IMAGE_ALT });
  return `${meta}\n    <link rel="sitemap" type="application/xml" href="./sitemap.xml" />\n    ${jsonLdScript(siteNodes(catalog))}\n    ${STYLE}`;
}

function indexBody(catalog: CdCatalogEntry[]): string {
  return `<main class="seo-static">
      <h1>${escapeHtml(PRODUCT)}</h1>
      <p>${escapeHtml(SITE_ABOUT)}</p>
      <noscript><p><strong>${escapeHtml(PRODUCT)} is an app that runs in your browser: please turn on JavaScript to design and play games.</strong> You can still read about it below and browse the <a href="${REPO_URL}">source code on GitHub</a>.</p></noscript>
      <h2>What you can do</h2>
      <ul>
        <li>Sit at a mid-90s desk: switch on the PC and run Game-Maker just like in 1994, or switch to today’s web editor.</li>
        <li>Draw blocks, monsters and your character; build maps and scenes; add Sound Blaster music, digitized sounds and PC-speaker effects.</li>
        <li>Play the original sample games, classic 90s shareware and new games — with a keyboard, a game controller or touch controls.</li>
        <li>Share your game as one web page, an installable offline web app, or a folder that runs in DOS (PLAYGAME).</li>
        <li>Everything stays in your browser and works offline. Files stay compatible with the original DOS Game-Maker 3.0.</li>
      </ul>
      ${gameList(catalog, pageHref)}
      <h2>Source code</h2>
      <p>${escapeHtml(PRODUCT)} is free and open source: <a href="${REPO_URL}">${REPO_URL.replace('https://', '')}</a>. <span class="seo-note">${escapeHtml(FORK_NOTE)}.</span></p>
    </main>`;
}

/** dos.html: the PC on its own (src/dosPage). */
function dosHead(): string {
  return `${metaTags({ ...ROUTES.dos, url: `${SITE_URL}dos.html`, image: OG_IMAGE, imageAlt: OG_IMAGE_ALT })}\n    ${STYLE}`;
}

function dosBody(): string {
  return `<main class="seo-static">
      <h1>DOS Game-Maker</h1>
      <p>${escapeHtml(ROUTES.dos.description)}</p>
      <noscript><p><strong>The PC runs in your browser: please turn on JavaScript.</strong></p></noscript>
      <h2>Links to this page</h2>
      <ul>
        <li><a href="./dos.html">dos.html</a>: boots straight into Game-Maker.</li>
        <li><a href="./dos.html?game=teddy">dos.html?game=&lt;id&gt;</a>: puts that game’s disk in drive A: and opens it in Game-Maker.</li>
        <li><a href="./dos.html?run=dos">dos.html?run=dos</a>: stays at the DOS prompt; <a href="./dos.html?run=bbs">dos.html?run=bbs</a> calls the BBS.</li>
      </ul>
      <p>Back to <a href="./">${escapeHtml(PRODUCT)}</a>, or sit down at the whole 1994 desk.</p>
    </main>`;
}

/** play.html: what each game is, so the page can name itself before the game loads. */
function playHead(catalog: CdCatalogEntry[]): string {
  const meta = metaTags({ ...ROUTES.player, image: OG_IMAGE, imageAlt: OG_IMAGE_ALT });
  // each game's title and description; its addresses follow from its id (playUrl, gameImagePath)
  const games = Object.fromEntries(playable(catalog).map((g) => [g.id, { title: g.title, description: gameDescription(g) }]));
  // Runs before the app: the page's title, description, picture and canonical address (the
  // game's own page, which has the game's JSON-LD) for ?game=<id> (search engines that run
  // scripts see them; link previews see the defaults, which is why each game has its own page).
  const script = `<script>
      (function () {
        var games = ${scriptJson(games)};
        var id = new URLSearchParams(location.search).get('game');
        var g = id && Object.prototype.hasOwnProperty.call(games, id) ? games[id] : null;
        var site = ${JSON.stringify(SITE_URL)};
        var url = g ? site + ${scriptJson(gamePage('GAMEID').split('GAMEID'))}.join(encodeURIComponent(id)) : null;
        if (g) g.image = site + ${scriptJson(gameImagePath('GAMEID').split('GAMEID'))}.join(encodeURIComponent(id));
        var title = g ? g.title + ${JSON.stringify(` · play in your browser · ${PRODUCT}`)} : null;
        function set(sel, attr, value) { var el = document.head.querySelector(sel); if (el) el.setAttribute(attr, value); }
        if (g) {
          document.title = title;
          // The player names the page after the game; keep the longer title.
          new MutationObserver(function () { if (document.title === g.title) document.title = title; }).observe(document.querySelector('title'), { childList: true });
          ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'].forEach(function (s) { set(s, 'content', g.description); });
          ['meta[property="og:title"]', 'meta[name="twitter:title"]'].forEach(function (s) { set(s, 'content', title); });
          ['meta[property="og:image"]', 'meta[name="twitter:image"]'].forEach(function (s) { set(s, 'content', g.image); });
          ['meta[property="og:image:alt"]', 'meta[name="twitter:image:alt"]'].forEach(function (s) { set(s, 'content', g.title + ': its title screen'); });
          var link = document.createElement('link'); link.rel = 'canonical'; link.href = url; document.head.appendChild(link);
          var og = document.createElement('meta'); og.setAttribute('property', 'og:url'); og.content = url; document.head.appendChild(og);
        }
      })();
    </script>`;
  return `${HEAD_START}${meta}\n    ${script}\n    ${STYLE}${HEAD_END}`;
}

function playBody(catalog: CdCatalogEntry[]): string {
  return `${BODY_START}<main class="seo-static">
      <h1>${escapeHtml(PRODUCT)} — Player</h1>
      <p>${escapeHtml(ROUTES.player.description)} Pick a game below; it starts here in the page. Back to <a href="./">${escapeHtml(PRODUCT)}</a> to make your own.</p>
      <noscript><p><strong>The games run in your browser: please turn on JavaScript to play.</strong></p></noscript>
      ${gameList(catalog, pageHref)}
      <p class="seo-note">Made with <a href="./">${escapeHtml(PRODUCT)}</a> · <a href="${REPO_URL}">source code</a> · ${escapeHtml(FORK_NOTE)}.</p>
    </main>${BODY_END}`;
}

/** play-<id>.html: the game's own tags, with <meta name="gm:game"> telling play.ts which game. */
export function gameHead(g: CdCatalogEntry): string {
  const meta = metaTags({
    title: pageTitle(g),
    description: gameDescription(g),
    url: playUrl(g.id),
    image: imageUrl(g),
    imageSize: GAME_IMAGE_SIZE,
    imageAlt: `${g.title}: its title screen, with “Play in your browser · ${PRODUCT}”`,
  });
  const ld = [
    gameJsonLd(g, playUrl(g.id), imageUrl(g)),
    {
      '@type': 'WebPage',
      '@id': playUrl(g.id),
      url: playUrl(g.id),
      name: pageTitle(g),
      description: gameDescription(g),
      primaryImageOfPage: imageUrl(g),
      about: { '@id': `${playUrl(g.id)}#game` },
      isPartOf: { '@type': 'WebSite', name: PRODUCT, url: SITE_URL },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: PRODUCT, item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Play', item: `${SITE_URL}play.html` },
          { '@type': 'ListItem', position: 3, name: g.title, item: playUrl(g.id) },
        ],
      },
    },
  ];
  return `${HEAD_START}<meta name="gm:game" content="${escapeHtml(g.id)}" />\n    ${meta}\n    ${jsonLdScript(ld)}\n    ${STYLE}${HEAD_END}`;
}

/**
 * A game's readable page text. A shareware game's notice stays in the game (shown before it
 * starts) and out of this text: the CD's notices give their authors' 1994 home addresses.
 */
export function gameBody(g: CdCatalogEntry): string {
  const what = g.original ? 'A new shareware game' : g.kind === 'shareware' ? 'Shareware from the 90s' : 'A sample game that came with Game-Maker 3.0';
  return `${BODY_START}<main class="seo-static">
      <h1>${escapeHtml(g.title)}</h1>
      <p>${escapeHtml(what)}${credit(g) ? ` · ${escapeHtml(credit(g))}` : ''}${g.price ? ` · registration ${escapeHtml(g.price)}` : ''}</p>
      <p><img src="./${gameImagePath(g.id)}" width="600" height="315" loading="lazy" alt="${escapeHtml(g.title)}: its title screen" style="max-width:100%;height:auto;image-rendering:pixelated" /></p>
      ${readable(g.blurb) ? `<p>${escapeHtml(g.blurb!)}</p>` : ''}
      <p>Play ${escapeHtml(g.title)} right here in your browser — nothing to download or install — with a keyboard, a game controller or touch controls.</p>
      <noscript><p><strong>The game runs in your browser: please turn on JavaScript to play.</strong></p></noscript>
      ${g.kind === 'shareware' && g.notice ? `<p>Shareware: the author’s notice and how to register are in the game, shown before it starts.</p>` : ''}
      <p><a href="./play.html">More games to play</a> · <a href="./">${escapeHtml(PRODUCT)}</a>: make your own game in your browser.</p>
      <p class="seo-note">Made with <a href="./">${escapeHtml(PRODUCT)}</a> · <a href="${REPO_URL}">source code</a> · ${escapeHtml(FORK_NOTE)}.</p>
    </main>${BODY_END}`;
}

/** A game's page from play.html (as built, or as served in dev): its own title, tags and text. */
export function gamePageHtml(playHtml: string, g: CdCatalogEntry): string {
  const swap = (html: string, start: string, end: string, part: string) => {
    const a = html.indexOf(start);
    const b = html.indexOf(end, a);
    if (a < 0 || b < 0) throw new Error(`play.html has no ${start}…${end}`);
    return html.slice(0, a) + part + html.slice(b + end.length);
  };
  const html = playHtml.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(pageTitle(g))}</title>`);
  return swap(swap(html, HEAD_START, HEAD_END, gameHead(g)), BODY_START, BODY_END, gameBody(g));
}

/** The game whose page this is (play-<id>.html), if any. */
function pageGame(catalog: CdCatalogEntry[], path: string): CdCatalogEntry | undefined {
  const m = /(?:^|\/)play-([^/]+)\.html$/.exec(path.split('?')[0]);
  const id = m && decodeURIComponent(m[1]);
  return id ? playable(catalog).find((g) => g.id === id) : undefined;
}

/** A game's preview picture, from its files on disk. */
function gameImage(cdRoot: string, g: CdCatalogEntry, files = cdFiles(cdRoot)): Uint8Array {
  return gameCardPng(g, (name) => {
    const p = files.get(`${g.path}${name}`.toLowerCase());
    return p ? readFileSync(p) : undefined;
  });
}

export function sitemapXml(catalog: CdCatalogEntry[], lastmod: string): string {
  const urls = [
    { loc: SITE_URL, priority: '1.0' },
    { loc: `${SITE_URL}dos.html`, priority: '0.7' },
    ...playable(catalog).map((g) => ({ loc: playUrl(g.id), priority: g.original ? '0.8' : '0.6' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeHtml(u.loc).replace(/&#38;/g, '&amp;')}</loc><lastmod>${lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
}

export function robotsTxt(): string {
  // GitHub Pages serves this at /<repo>/robots.txt; crawlers read robots.txt only at a
  // host's root, so the Sitemap line (and <link rel="sitemap">) is what matters here.
  return `User-agent: *
Allow: /
Disallow: /GameMaker-SandboxEdition/standalone.html

Sitemap: ${SITE_URL}sitemap.xml
`;
}

const md = (s: string) =>
  s
    .replace(/\s+/g, ' ')
    .replace(/([[\]])/g, '\\$1')
    .trim();
const mdLink = (text: string, url: string, about?: string) => `- [${md(text)}](${url})${about ? `: ${md(about)}` : ''}`;
/** Prose, not a text-mode drawing (Zark's blurb is its keypad chart). */
const readable = (s?: string) => !!s && (s.match(/[a-z ]/gi)?.length ?? 0) / s.length > 0.85;
const repoFile = (path: string) => `${REPO_URL}/blob/master/${path}`;
const repoDir = (path: string) => `${REPO_URL}/tree/master/${path}`;

/** /llms.txt, following the llmstxt.org proposal: a title, a summary, then sections of links. */
export function llmsTxt(catalog: CdCatalogEntry[]): string {
  const games = groups(catalog)
    .filter(([, , list]) => list.length)
    .map(
      ([head, about, list]) =>
        `## ${head}\n\n${md(about)}\n\n${list
          .map((g) => mdLink(g.title, playUrl(g.id), [credit(g), readable(g.blurb) ? clip(g.blurb!, 160) : ''].filter(Boolean).join(' — ')))
          .join('\n')}`,
    );
  return `# ${PRODUCT}

> ${md(SITE_ABOUT)}

${md(FORK_NOTE)}. It runs entirely in the browser (no account, no server): games are kept in the browser's storage and the site works offline. Every file it writes is in the original Game-Maker 3.0 / PLAYGAME formats (.gam, .pal, .bbl/.mbl/.cbl, .chr, .mon, .map, .snd and the standard .gif, .fli, .cmf, .voc), so games run in DOS (or DOSBox) as well. Game-Maker and its PLAYGAME player are re-implemented in TypeScript from the released C source; it is not a PC emulator, and no DOS or x86 code runs (some hardware is emulated: VGA mode 13h and the OPL2 FM sound chip). The site opens on a recreated 1994 desk with a simulated DOS PC running Game-Maker's ported designers; today's web interface is one click away.

## The app

${[
  mdLink(PRODUCT, SITE_URL, 'opens on the 1994 desk or today’s web editor, whichever the visitor used last'),
  mdLink('DOS Game-Maker', `${SITE_URL}dos.html`, 'the 1994 PC on its own, straight into Game-Maker; dos.html?game=<id> opens a game in it'),
  mdLink('Guide', `${SITE_URL}#/help`, 'how to use the editor: blocks, monsters, characters, maps and scenes, sounds and music, testing and exporting'),
  mdLink(
    'Player',
    `${SITE_URL}play.html`,
    'plays one game full-window; each game below has its own page (play-<id>.html), and play.html?game=<id> plays it too',
  ),
  mdLink('Sitemap', `${SITE_URL}sitemap.xml`),
].join('\n')}

${games.join('\n\n')}

## Source code and file formats

${[
  mdLink('Source code', REPO_URL, 'the repository on GitHub: the web app (TypeScript, Vite), the new games, and the original 1994 release'),
  mdLink('Repository README', repoFile('README.md'), 'what is in the repository and how it is published'),
  mdLink('Web app README', repoFile('web/README.md'), 'building, running and testing the web app'),
  mdLink('Source map', repoFile('web/src/README.md'), 'what each folder of the web app holds and how the pieces fit'),
  mdLink(
    'File formats',
    repoDir('web/src/formats'),
    'readers and writers for every Game-Maker file, byte for byte (Borland C++ 16-bit layout: int is 2 bytes, structs are packed)',
  ),
  mdLink('Game engine', repoDir('web/src/engine'), 'a TypeScript port of PLAYGAME.C'),
  mdLink('Original DOS source', repoDir('code/GM'), 'the C source of RSD Game-Maker 3.0, released under the MIT License in 2014'),
  mdLink('Making the new games', repoFile('games/README.md'), 'the Sandbox Software games, each built in code into real Game-Maker files'),
].join('\n')}

## License

${[mdLink('NOTICE', NOTICE_URL, 'credits, history and third-party trademarks'), mdLink('LICENSE', repoFile('LICENSE'), 'MIT License')].join('\n')}
`;
}

/** The files that are generated rather than kept in public/, by their path on the site. */
function generated(cdRoot: string): Record<string, { type: string; body: () => string }> {
  return {
    'robots.txt': { type: 'text/plain; charset=utf-8', body: robotsTxt },
    'sitemap.xml': { type: 'application/xml; charset=utf-8', body: () => sitemapXml(cdCatalog(cdRoot), new Date().toISOString().slice(0, 10)) },
    'llms.txt': { type: 'text/plain; charset=utf-8', body: () => llmsTxt(cdCatalog(cdRoot)) },
  };
}

export function seoPages(cdRoot: string): Plugin {
  return {
    name: 'gamemaker-seo',
    // The dev server would answer these with index.html (its single-page fallback).
    configureServer(server) {
      const files = generated(cdRoot);
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        const path = (req.url ?? '').split('?')[0].replace(/^\/+/, '');
        const file = files[path];
        if (file) {
          res.setHeader('Content-Type', file.type);
          res.end(file.body());
          return;
        }
        // A game's page: play.html as the dev server serves it, then made the game's own.
        const image = /^og\/([^/]+)\.png$/.exec(path);
        const catalog = image || /^play-[^/]+\.html$/.test(path) ? cdCatalog(cdRoot) : [];
        const imageGame = image && playable(catalog).find((g) => g.id === decodeURIComponent(image[1]));
        if (imageGame) {
          res.setHeader('Content-Type', 'image/png');
          res.end(gameImage(cdRoot, imageGame));
          return;
        }
        const g = pageGame(catalog, path);
        if (!g) return next();
        server
          .transformIndexHtml(`/${path}`, readFileSync(join(server.config.root, 'play.html'), 'utf8'), req.originalUrl)
          .then((html) => {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(html);
          })
          .catch(next);
      });
    },
    transformIndexHtml(html, ctx: IndexHtmlTransformContext) {
      if (!html.includes(HEAD_MARK)) return html;
      if (/dos\.html$/.test(ctx.filename) || ctx.path.endsWith('dos.html')) return html.replace(HEAD_MARK, dosHead()).replace(BODY_MARK, dosBody());
      const catalog = cdCatalog(cdRoot);
      const g = pageGame(catalog, ctx.path);
      const play = !!g || /play\.html$/.test(ctx.filename) || ctx.path.endsWith('play.html');
      const out = html.replace(HEAD_MARK, play ? playHead(catalog) : indexHead(catalog)).replace(BODY_MARK, play ? playBody(catalog) : indexBody(catalog));
      return g ? gamePageHtml(out, g) : out;
    },
    generateBundle: {
      // After Vite has written play.html (with its script and stylesheet links), so each
      // game's page loads the same player.
      order: 'post',
      handler(_options, bundle) {
        for (const [fileName, file] of Object.entries(generated(cdRoot))) this.emitFile({ type: 'asset', fileName, source: file.body() });
        const play = bundle['play.html'];
        if (play?.type !== 'asset') return;
        const files = cdFiles(cdRoot);
        for (const g of playable(cdCatalog(cdRoot))) {
          this.emitFile({ type: 'asset', fileName: gamePage(g.id), source: gamePageHtml(String(play.source), g) });
          this.emitFile({ type: 'asset', fileName: gameImagePath(g.id), source: gameImage(cdRoot, g, files) });
        }
      },
    },
  };
}
