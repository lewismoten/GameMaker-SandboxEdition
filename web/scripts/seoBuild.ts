// Search engines and link previews mostly don't run the app, so the pages carry what they
// need as static HTML: meta/Open Graph/Twitter tags, schema.org JSON-LD for the app and
// every bundled game, and readable text with links (shown until the app starts, and to
// browsers without JavaScript). The build also writes robots.txt and sitemap.xml.
//
// index.html and play.html mark where it goes with <!--SEO:HEAD--> and <!--SEO:BODY-->.
import type { Plugin } from 'vite';
import { cdCatalog, type CdCatalogEntry } from './cdGames';
import {
  appJsonLd,
  clip,
  escapeHtml,
  gameDescription,
  gameJsonLd,
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
import { FORK_NOTE, PRODUCT } from '../src/edition';

export const HEAD_MARK = '<!--SEO:HEAD-->';
export const BODY_MARK = '<!--SEO:BODY-->';

const playable = (catalog: CdCatalogEntry[]) => catalog.filter((g) => g.gam);
const credit = (g: CdCatalogEntry) => [g.author ?? g.company, g.year].filter(Boolean).join(', ');

function groups(catalog: CdCatalogEntry[]): [string, string, CdCatalogEntry[]][] {
  const games = playable(catalog);
  return [
    ['New games', 'Made for this project with Game-Maker, released as shareware.', games.filter((g) => g.original)],
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

function siteNodes(catalog: CdCatalogEntry[]): Record<string, unknown>[] {
  const games = playable(catalog).map((g) => gameJsonLd(g, playUrl(g.id)));
  return [
    appJsonLd(),
    repoJsonLd(),
    {
      '@type': 'ItemList',
      '@id': `${SITE_URL}#games`,
      name: `Games you can play with ${PRODUCT}`,
      numberOfItems: games.length,
      itemListElement: games.map((item, i) => ({ '@type': 'ListItem', position: i + 1, item })),
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
      ${gameList(catalog, (g) => `./play.html?game=${encodeURIComponent(g.id)}`)}
      <h2>Source code</h2>
      <p>${escapeHtml(PRODUCT)} is free and open source: <a href="${REPO_URL}">${REPO_URL.replace('https://', '')}</a>. <span class="seo-note">${escapeHtml(FORK_NOTE)}.</span></p>
    </main>`;
}

/** play.html: what each game is, so the page can name itself before the game loads. */
function playHead(catalog: CdCatalogEntry[]): string {
  const meta = metaTags({ ...ROUTES.player, image: OG_IMAGE, imageAlt: OG_IMAGE_ALT });
  const games = Object.fromEntries(playable(catalog).map((g) => [g.id, { title: g.title, description: gameDescription(g), ld: gameJsonLd(g, playUrl(g.id)) }]));
  // Runs before the app: the page's title, description, canonical address and the game's
  // JSON-LD for ?game=<id> (search engines that run scripts see them; previews see the defaults).
  const script = `<script>
      (function () {
        var games = ${scriptJson(games)};
        var id = new URLSearchParams(location.search).get('game');
        var g = id && Object.prototype.hasOwnProperty.call(games, id) ? games[id] : null;
        var url = g ? ${JSON.stringify(SITE_URL)} + 'play.html?game=' + encodeURIComponent(id) : null;
        var title = g ? g.title + ${JSON.stringify(` · play in your browser · ${PRODUCT}`)} : null;
        function set(sel, attr, value) { var el = document.head.querySelector(sel); if (el) el.setAttribute(attr, value); }
        if (g) {
          document.title = title;
          // The player names the page after the game; keep the longer title.
          new MutationObserver(function () { if (document.title === g.title) document.title = title; }).observe(document.querySelector('title'), { childList: true });
          ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'].forEach(function (s) { set(s, 'content', g.description); });
          ['meta[property="og:title"]', 'meta[name="twitter:title"]'].forEach(function (s) { set(s, 'content', title); });
          var link = document.createElement('link'); link.rel = 'canonical'; link.href = url; document.head.appendChild(link);
          var og = document.createElement('meta'); og.setAttribute('property', 'og:url'); og.content = url; document.head.appendChild(og);
          var ld = document.createElement('script'); ld.type = 'application/ld+json';
          ld.textContent = JSON.stringify(Object.assign({ '@context': 'https://schema.org' }, g.ld)); document.head.appendChild(ld);
        }
      })();
    </script>`;
  return `${meta}\n    ${script}\n    ${STYLE}`;
}

function playBody(catalog: CdCatalogEntry[]): string {
  return `<main class="seo-static">
      <h1>${escapeHtml(PRODUCT)} — Player</h1>
      <p>${escapeHtml(ROUTES.player.description)} Pick a game below; it starts here in the page. Back to <a href="./">${escapeHtml(PRODUCT)}</a> to make your own.</p>
      <noscript><p><strong>The games run in your browser: please turn on JavaScript to play.</strong></p></noscript>
      ${gameList(catalog, (g) => `./play.html?game=${encodeURIComponent(g.id)}`)}
      <p class="seo-note">Made with <a href="./">${escapeHtml(PRODUCT)}</a> · <a href="${REPO_URL}">source code</a> · ${escapeHtml(FORK_NOTE)}.</p>
    </main>`;
}

export function sitemapXml(catalog: CdCatalogEntry[], lastmod: string): string {
  const urls = [{ loc: SITE_URL, priority: '1.0' }, ...playable(catalog).map((g) => ({ loc: playUrl(g.id), priority: g.original ? '0.8' : '0.6' }))];
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

export function seoPages(cdRoot: string): Plugin {
  return {
    name: 'gamemaker-seo',
    transformIndexHtml(html, ctx) {
      if (!html.includes(HEAD_MARK)) return html;
      const catalog = cdCatalog(cdRoot);
      const play = /play\.html$/.test(ctx.filename) || ctx.path.endsWith('play.html');
      return html.replace(HEAD_MARK, play ? playHead(catalog) : indexHead(catalog)).replace(BODY_MARK, play ? playBody(catalog) : indexBody(catalog));
    },
    generateBundle() {
      const catalog = cdCatalog(cdRoot);
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(catalog, new Date().toISOString().slice(0, 10)) });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt() });
    },
  };
}
