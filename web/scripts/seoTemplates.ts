// HTML tags, structured data and readable bodies for crawlable pages.
import type { CdCatalogEntry } from './cdGames';
import { SCOOP_TITLE } from './scoopFeed';
import { GUIDE_SECTIONS } from '../src/manual/guideSections';
import type { StaticPage } from './seoStaticPages';
import { credit, gameList, pageHref, playable, readable } from './seoCatalog';
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
import { FORK_NOTE, PRODUCT } from '../src/edition';
import { magazineJsonLd, siteLinksHtml, websiteJsonLd } from '../src/seo/siteSections';
import { byStarterGroup, isStarterGame } from '../src/project/starter';

// Around what the marks became in play.html, so a game's page can swap in its own.
const HEAD_START = '<!--seo:head-->';
const HEAD_END = '<!--/seo:head-->';
const BODY_START = '<!--seo:body-->';
const BODY_END = '<!--/seo:body-->';

const imageUrl = (g: CdCatalogEntry) => `${SITE_URL}${gameImagePath(g.id)}`;
const previewCaption = `Play in your browser · ${PRODUCT}`;
const pageTitle = (g: CdCatalogEntry) => `${g.title} · play in your browser · ${PRODUCT}`;

export const STYLE = `<style>
      .seo-static { box-sizing: border-box; min-height: 100vh; margin: 0; padding: 24px max(16px, calc((100% - 46rem) / 2)) 48px; background: #12122a; font: 16px/1.5 system-ui, sans-serif; color: #e8e8f0; }
      .seo-static a { color: #9cf; }
      .seo-static h1 { font: bold 1.8rem monospace; letter-spacing: 2px; color: #ff5; margin: 0 0 4px; }
      .seo-static h2 { font: bold 1.15rem monospace; color: #5f5; margin: 24px 0 4px; }
      .seo-static small { color: #aab; }
      .seo-static ul { padding-left: 1.2rem; }
      .seo-static .seo-note { color: #aab; font-size: 0.9rem; }
    </style>`;

/**
 * The home page's structured data: the site, the app, its source, the magazine, and the games
 * as a list of their own pages (each page carries the game's full JSON-LD, gameHead), which
 * keeps index.html small.
 */
function siteNodes(catalog: CdCatalogEntry[]): Record<string, unknown>[] {
  const games = playable(catalog);
  return [
    websiteJsonLd(),
    appJsonLd(),
    repoJsonLd(),
    ...magazineJsonLd(),
    {
      '@type': 'ItemList',
      '@id': `${SITE_URL}#games`,
      name: `Games you can play with ${PRODUCT}`,
      numberOfItems: games.length,
      itemListElement: games.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: playUrl(g.id), name: g.title })),
    },
  ];
}

export function indexHead(catalog: CdCatalogEntry[]): string {
  const meta = metaTags({ ...ROUTES.home, url: SITE_URL, image: OG_IMAGE, imageAlt: OG_IMAGE_ALT });
  return `${HEAD_START}${meta}\n    <link rel="sitemap" type="application/xml" href="./sitemap.xml" />\n    <link rel="alternate" type="application/rss+xml" title="${SCOOP_TITLE}" href="./scoop.xml" />\n    ${jsonLdScript(siteNodes(catalog))}\n    ${STYLE}${HEAD_END}`;
}

export function indexBody(catalog: CdCatalogEntry[]): string {
  return `${BODY_START}<main class="seo-static">
      <h1>${escapeHtml(PRODUCT)}</h1>
      <p>${escapeHtml(SITE_ABOUT)}</p>
      <noscript><p><strong>${escapeHtml(PRODUCT)} is an app that runs in your browser: please turn on JavaScript to design and play games.</strong> You can still read about it below and browse the <a href="${REPO_URL}">source code on GitHub</a>.</p></noscript>
      <h2>What you can do</h2>
      <ul>
        <li>Sit at a mid-90s desk: switch on the PC and run Game-Maker just like in 1994, or switch to today’s web editor.</li>
        <li>Draw blocks, monsters and your character; build maps and scenes; add Sound Blaster music, digitized sounds and PC-speaker effects.</li>
        <li>Play the original sample games, classic 90s shareware and new games — with a keyboard, a game controller or touch controls.</li>
        <li>Share your game as one web page, an installable offline web app, or a folder that runs in DOS (PLAYGAME).</li>
        <li>Choose Play offline in Settings to save a copy for offline play. Files stay compatible with the original DOS Game-Maker 3.0.</li>
      </ul>
      ${gameList(catalog, pageHref)}
      ${siteLinksHtml()}
      <h2>Source code</h2>
      <p>${escapeHtml(PRODUCT)} is free and open source: <a href="${REPO_URL}">${REPO_URL.replace('https://', '')}</a>. <span class="seo-note">${escapeHtml(FORK_NOTE)}.</span></p>
    </main>${BODY_END}`;
}

/** dos.html: the PC on its own (src/dosPage). */
export function dosHead(): string {
  return `${metaTags({ ...ROUTES.dos, url: `${SITE_URL}dos.html`, image: OG_IMAGE, imageAlt: OG_IMAGE_ALT })}\n    ${STYLE}`;
}

export function dosBody(): string {
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
      <p>Back to <a href="./">${escapeHtml(PRODUCT)}</a>, or <a href="./#/desk">sit down at the 1994 desk</a>.</p>
    </main>`;
}

/** play.html: what each game is, so the page can name itself before the game loads. */
export function playHead(catalog: CdCatalogEntry[]): string {
  const meta = metaTags({ ...ROUTES.player, url: `${SITE_URL}play.html`, image: OG_IMAGE, imageAlt: OG_IMAGE_ALT });
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
          ['meta[property="og:image:alt"]', 'meta[name="twitter:image:alt"]'].forEach(function (s) { set(s, 'content', g.title + ' — ' + ${scriptJson(previewCaption)}); });
          set('link[rel="canonical"]', 'href', url);
          set('meta[property="og:url"]', 'content', url);
        }
      })();
    </script>`;
  // the generic player is not a page to find: each game has its own play-<id>.html (this head is swapped out there)
  return `${HEAD_START}${meta}\n    <meta name="robots" content="noindex" />\n    ${script}\n    ${STYLE}${HEAD_END}`;
}

export function playBody(catalog: CdCatalogEntry[]): string {
  return `${BODY_START}<main class="seo-static">
      <h1>${escapeHtml(PRODUCT)} — Player</h1>
      <p>${escapeHtml(ROUTES.player.description)} Pick a game below; it starts here in the page. Back to <a href="./">${escapeHtml(PRODUCT)}</a> to make your own.</p>
      <noscript><p><strong>The games run in your browser: please turn on JavaScript to play.</strong></p></noscript>
      ${gameList(catalog, pageHref)}
      <p class="seo-note">Made with <a href="./">${escapeHtml(PRODUCT)}</a> · <a href="${REPO_URL}">source code</a> · ${escapeHtml(FORK_NOTE)}.</p>
    </main>${BODY_END}`;
}

/** play-<id>.html: the game's own tags, with <meta name="gm:game"> telling play.ts which game. */
function gameHead(g: CdCatalogEntry): string {
  const meta = metaTags({
    title: pageTitle(g),
    description: gameDescription(g),
    url: playUrl(g.id),
    image: imageUrl(g),
    imageSize: GAME_IMAGE_SIZE,
    imageAlt: `${g.title} — ${previewCaption}`,
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
      isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}#website`, name: PRODUCT, url: SITE_URL },
      // the site, then the game (play.html on its own sends a visitor to the home page)
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: PRODUCT, item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: g.title, item: playUrl(g.id) },
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
function gameBody(g: CdCatalogEntry): string {
  const starter = isStarterGame(g);
  const what = starter
    ? 'A Starter game that shows one Game-Maker idea'
    : g.original
      ? 'A new shareware game'
      : g.kind === 'shareware'
        ? 'Shareware from the 90s'
        : 'A sample game that came with Game-Maker 3.0';
  return `${BODY_START}<main class="seo-static">
      <h1>${escapeHtml(g.title)}</h1>
      <p>${escapeHtml(what)}${credit(g) ? ` · ${escapeHtml(credit(g))}` : ''}${!starter && g.price ? ` · registration ${escapeHtml(g.price)}` : ''}</p>
      <p><img src="./${gameImagePath(g.id)}" width="600" height="315" loading="lazy" alt="${escapeHtml(g.title)} — ${escapeHtml(previewCaption)}" style="max-width:100%;height:auto;image-rendering:pixelated" /></p>
      ${readable(g.blurb) ? `<p>${escapeHtml(g.blurb!)}</p>` : ''}
      <p>Play ${escapeHtml(g.title)} right here in your browser — nothing to download or install — with a keyboard, a game controller or touch controls.</p>
      <noscript><p><strong>The game runs in your browser: please turn on JavaScript to play.</strong></p></noscript>
      ${!starter && g.kind === 'shareware' && g.notice ? `<p>Shareware: the author’s notice and how to register are in the game, shown before it starts.</p>` : ''}
      <p><a href="./play.html">More games to play</a> · <a href="./">${escapeHtml(PRODUCT)}</a>: make your own game in your browser.</p>
      <p class="seo-note">Made with <a href="./">${escapeHtml(PRODUCT)}</a> · <a href="${REPO_URL}">source code</a> · ${escapeHtml(FORK_NOTE)}.</p>
    </main>${BODY_END}`;
}

/** A game's page from play.html (as built, or as served in dev): its own title, tags and text. */
export function gamePageHtml(playHtml: string, g: CdCatalogEntry): string {
  const html = playHtml.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(pageTitle(g))}</title>`);
  return swapPart(swapPart(html, HEAD_START, HEAD_END, gameHead(g)), BODY_START, BODY_END, gameBody(g));
}

/** `html` with what lies between its `start` and `end` marks (and the marks) replaced by `part`. */
function swapPart(html: string, start: string, end: string, part: string): string {
  const a = html.indexOf(start);
  const b = html.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error(`the page has no ${start}…${end}`);
  return html.slice(0, a) + part + html.slice(b + end.length);
}

export type GuideSection = (typeof GUIDE_SECTIONS)[number];
/** A Guide section's own page. */
export const guideFile = (id: string) => `help-${encodeURIComponent(id)}.html`;

function guideHead([id, title, html]: GuideSection): string {
  const meta = metaTags({
    title: `${title} · Guide · ${PRODUCT}`,
    // its first paragraph says what the section is (a table or list would read as noise)
    // the first paragraphs until there are about 90 characters (a page may open with a short lead-in ending in a colon)
    description: clip(
      ([...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].reduce((s, m) => (s.length >= 90 ? s : `${s} ${m[1]}`), '') || html).replace(/<[^>]+>/g, ' '),
      155,
    ),
    url: `${SITE_URL}${guideFile(id)}`,
    image: OG_IMAGE,
    imageAlt: OG_IMAGE_ALT,
    type: 'article',
  });
  // the app opens on this section: it reads the address's #/help/<id> as it starts
  const open = `<script>if(!location.hash)history.replaceState(null,'',${JSON.stringify(`#/help/${id}`)})</script>`;
  return `${HEAD_START}${meta}\n    ${open}\n    ${STYLE}${HEAD_END}`;
}

/** The How do I…? list as plain text for crawlers: each Starter's questions under its group, linked to the Starter's play page (the app swaps in its searchable index). */
function howDoIList(catalog: CdCatalogEntry[]): string {
  const starters = playable(catalog).filter((g) => isStarterGame(g) && (g.original?.manual as { howDoI?: { q: string }[] } | undefined)?.howDoI?.length);
  return byStarterGroup(starters)
    .map(
      (grp) =>
        `<h3>${escapeHtml(grp.name)}</h3>\n` +
        grp.games
          .map((g) => {
            const qs = (g.original!.manual as unknown as { howDoI: { q: string }[] }).howDoI;
            return `<h4><a href="${pageHref(g)}">${escapeHtml(g.title)}</a></h4>\n<ul>${qs.map((q) => `<li>${escapeHtml(q.q)}</li>`).join('')}</ul>`;
          })
          .join('\n'),
    )
    .join('\n');
}

function guideBody([id, title, html]: GuideSection, catalog?: CdCatalogEntry[]): string {
  if (id === 'how-do-i' && catalog) html = html.replace(/<p>The searchable list shows here once the page has loaded\.<\/p>/, howDoIList(catalog));
  return `${BODY_START}<main class="seo-static">
      <p><a href="./#/help">${escapeHtml(PRODUCT)} Guide</a></p>
      <h1>${escapeHtml(title)}</h1>
      ${html}
      <p class="seo-note"><a href="./#/help/${escapeHtml(id)}">Open ${escapeHtml(title)} in the Guide</a> · <a href="./">${escapeHtml(PRODUCT)}</a></p>
    </main>${BODY_END}`;
}

/** A Guide section's page from index.html (as built, or as served in dev): its own title, tags and text. */
export function guidePageHtml(indexHtml: string, section: GuideSection, catalog?: CdCatalogEntry[]): string {
  const html = indexHtml.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(`${section[1]} · Guide · ${PRODUCT}`)}</title>`);
  return swapPart(swapPart(html, HEAD_START, HEAD_END, guideHead(section)), BODY_START, BODY_END, guideBody(section, catalog));
}

/** A static page (cast.html, library.html) from index.html: its own title, tags and text; the app opens its #/… address. */
export function staticPageHtml(indexHtml: string, page: StaticPage): string {
  const meta = metaTags({
    title: page.title,
    description: page.description,
    url: `${SITE_URL}${page.file}`,
    image: OG_IMAGE,
    imageAlt: OG_IMAGE_ALT,
  });
  const open = `<script>if(!location.hash)history.replaceState(null,'',${JSON.stringify(page.hash)})</script>`;
  const body = `${BODY_START}<main class="seo-static">
      <h1>${escapeHtml(page.h1)}</h1>
      ${page.html}
      <p class="seo-note"><a href="./${escapeHtml(page.hash)}">Open ${escapeHtml(page.h1)} in the app</a> · <a href="./">${escapeHtml(PRODUCT)}</a></p>
    </main>${BODY_END}`;
  const html = indexHtml.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  return swapPart(swapPart(html, HEAD_START, HEAD_END, `${HEAD_START}${meta}\n    ${open}\n    ${STYLE}${HEAD_END}`), BODY_START, BODY_END, body);
}
