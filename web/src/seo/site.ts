// What search engines and link previews learn about the site and its games: the public
// address, descriptions, <meta>/Open Graph/Twitter tags and schema.org JSON-LD. Pure
// functions shared by the build (scripts/seoBuild.ts), the pages at run time
// (src/seo/route.ts) and the web exports (src/export).
import { FORK_NOTE, PRODUCT, SHORT } from '../edition';

/** Where the site is published (GitHub Pages), with a trailing slash. */
export const SITE_URL = 'https://lewismoten.github.io/GameMaker-SandboxEdition/';
export const REPO_URL = 'https://github.com/lewismoten/GameMaker-SandboxEdition';
export const OG_IMAGE = `${SITE_URL}og-image.png`;
export const OG_IMAGE_ALT = 'A mid-90s computer desk with Game-Maker: Sandbox Edition on the monitor, game boxes on the shelf and a disk box.';

/** For description tags (search results show about 160 characters). */
export const SITE_DESCRIPTION =
  'Make DOS-style games in your browser with no programming: a free, open-source remake of RSD Game-Maker 3.0 (1994). Play 90s shareware and export your own games.';
/** The longer version, for text on the page. */
export const SITE_ABOUT =
  'Make DOS-style games in your web browser with no programming: a free, open-source remake of Recreational Software Designs’ Game-Maker 3.0 (1994). Draw blocks and monsters, build maps, add music and sound, play the original sample and shareware games, and export your game as a web page, a web app or for DOS.';

/** What each page of the site is about, for <title> and <meta name="description">. */
export const ROUTES = {
  home: { title: `${PRODUCT} — make retro DOS games in your browser`, description: SITE_DESCRIPTION },
  desk: {
    title: `${PRODUCT} — the 1994 desk`,
    description:
      'Sit down at a mid-90s PC: switch it on, run Game-Maker from C:\\GM, pick a game from the disk box or the shareware catalog, and play or design it just like in 1994 — in your browser.',
  },
  guide: {
    title: `Guide · ${PRODUCT}`,
    description: `How to use ${PRODUCT}: making blocks, monsters and characters, building maps and scenes, sounds and music, testing and exporting your game for the web or DOS.`,
  },
  cast: {
    title: `The cast · ${PRODUCT}`,
    description:
      'Who keeps turning up in the new games: Teddy the corgi, Gwinn, Doc Leo the friendly hobo clown, THE CHEZ the tomato-red CitiCar, Carl the fly and more, with where to find each one, and how the Sandbox Software games differ from The Bard of Bizarre’s.',
  },
  mac: {
    title: `Playing the games on a Mac · ${PRODUCT}`,
    description:
      'Download any game as a Mac app. Why macOS says Apple could not verify it (the apps are built in your browser, so they are not notarized), how to open it the first time, what the app does and how to remove it.',
  },
  windows: {
    title: `Playing the games on Windows · ${PRODUCT}`,
    description:
      'Download any game as a Windows program. Why SmartScreen says “Windows protected your PC” (the programs are built in your browser, so they are not code-signed), how to run it the first time, what the program does and how to remove it.',
  },
  linux: {
    title: `Playing the games on Linux · ${PRODUCT}`,
    description:
      'Download any game for Linux: how to extract and play it, the WebKitGTK package it needs on Debian, Ubuntu, Fedora and Arch, the web browser fallback, adding it to the applications menu, what the program does and how to remove it.',
  },
  editor: {
    title: `Editor · ${PRODUCT}`,
    description: `Designing a game in ${PRODUCT}, the browser remake of RSD Game-Maker 3.0.`,
  },
  player: {
    title: `Play · ${SHORT}`,
    description: `Play games made with Game-Maker 3.0 in your browser — the original samples, 90s shareware and new games — with ${PRODUCT}.`,
  },
} as const;

export type RouteName = keyof typeof ROUTES;

/** The bits of a game the tags and JSON-LD need (a games/index.json entry fits). */
export interface GameSeo {
  id?: string;
  title: string;
  blurb?: string;
  author?: string;
  company?: string;
  year?: number;
  price?: string;
  kind?: 'gameware' | 'shareware';
  /** Original games made for this project (catalog entries with `original`). */
  original?: unknown;
}

export const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** JSON that is safe inside a <script> element. */
export const scriptJson = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');

/**
 * A bundled game's own play page, next to play.html (play.html?game=<id> plays it too, but
 * link previews don't run scripts, so each game has a page with its tags baked in).
 */
export function gamePage(id: string): string {
  return `play-${encodeURIComponent(id)}.html`;
}

/** The address of a bundled game's play page (its canonical address). */
export function playUrl(id: string): string {
  return `${SITE_URL}${gamePage(id)}`;
}

/** A bundled game's link preview picture (scripts/ogImage.ts), by its path on the site. */
export function gameImagePath(id: string): string {
  return `og/${encodeURIComponent(id)}.png`;
}

export const GAME_IMAGE_SIZE = [1200, 630] as const;

/** A sentence or two about a game, for its description tag. */
export function gameDescription(game: GameSeo): string {
  const by = game.author ?? game.company;
  const made = [by && `by ${by}`, game.year && `(${game.year})`].filter(Boolean).join(' ');
  const what = game.original
    ? 'A new shareware game made with Game-Maker'
    : game.kind === 'shareware'
      ? 'A 90s shareware game made with Game-Maker'
      : game.kind === 'gameware'
        ? 'A sample game that came with Game-Maker 3.0'
        : 'A game made with Game-Maker';
  const head = `${game.title}${made ? ` ${made}` : ''}: ${what.charAt(0).toLowerCase()}${what.slice(1)}, playable in your browser.`;
  const text = game.blurb ? `${head} ${game.blurb}` : head;
  return clip(text, 200);
}

export function clip(text: string, max: number): string {
  const one = text.replace(/\s+/g, ' ').trim();
  return one.length > max ? `${one.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : one;
}

export interface PageMeta {
  title: string;
  description: string;
  /** Absolute canonical address (left out when unknown, e.g. an exported game). */
  url?: string;
  /** Absolute image address for link previews. */
  image?: string;
  /** Its width and height in pixels (known for the site's picture). */
  imageSize?: readonly [number, number];
  imageAlt?: string;
  type?: 'website' | 'article';
  siteName?: string;
}

/** <meta>/<link> tags for a page head (no <title>; the page has its own). */
export function metaTags(m: PageMeta): string {
  const tags: string[] = [`<meta name="description" content="${escapeHtml(m.description)}" />`];
  const size = m.image && (m.imageSize ?? (m.image === OG_IMAGE ? ([1200, 630] as const) : undefined));
  if (m.url) tags.push(`<link rel="canonical" href="${escapeHtml(m.url)}" />`);
  const og: [string, string | undefined][] = [
    ['og:type', m.type ?? 'website'],
    ['og:site_name', m.siteName ?? PRODUCT],
    ['og:title', m.title],
    ['og:description', m.description],
    ['og:url', m.url],
    ['og:image', m.image],
    ['og:image:width', size && String(size[0])],
    ['og:image:height', size && String(size[1])],
    ['og:image:alt', m.image ? m.imageAlt : undefined],
  ];
  for (const [p, v] of og) if (v) tags.push(`<meta property="${p}" content="${escapeHtml(v)}" />`);
  const tw: [string, string | undefined][] = [
    ['twitter:card', m.image ? 'summary_large_image' : 'summary'],
    ['twitter:title', m.title],
    ['twitter:description', m.description],
    ['twitter:image', m.image],
    ['twitter:image:alt', m.image ? m.imageAlt : undefined],
  ];
  for (const [n, v] of tw) if (v) tags.push(`<meta name="${n}" content="${escapeHtml(v)}" />`);
  return tags.join('\n    ');
}

/** The site itself, as schema.org data. */
export function appJsonLd(): Record<string, unknown> {
  return {
    '@type': ['WebApplication', 'SoftwareApplication'],
    '@id': `${SITE_URL}#app`,
    name: PRODUCT,
    alternateName: [SHORT],
    url: SITE_URL,
    description: SITE_ABOUT,
    applicationCategory: 'GameApplication',
    applicationSubCategory: 'Game creation tool',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript and a modern web browser.',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    image: OG_IMAGE,
    screenshot: OG_IMAGE,
    license: `${REPO_URL}/blob/master/NOTICE.md`,
    sameAs: [REPO_URL],
    disambiguatingDescription: FORK_NOTE,
    isBasedOn: {
      '@type': 'SoftwareApplication',
      name: 'Game-Maker 3.0',
      operatingSystem: 'MS-DOS',
      author: { '@type': 'Organization', name: 'Recreational Software Designs' },
    },
  };
}

/** The source code, as schema.org data. */
export function repoJsonLd(): Record<string, unknown> {
  return {
    '@type': 'SoftwareSourceCode',
    '@id': `${REPO_URL}#code`,
    name: `${PRODUCT} source code`,
    codeRepository: REPO_URL,
    programmingLanguage: 'TypeScript',
    targetProduct: { '@id': `${SITE_URL}#app` },
  };
}

/** What made a game: this app, its site and its source code. */
export function madeWith(): Record<string, unknown> {
  return { '@type': 'SoftwareApplication', name: PRODUCT, url: SITE_URL, sameAs: [REPO_URL], applicationCategory: 'GameApplication' };
}

/** A game as a schema.org VideoGame. `url` is where it plays (absolute), when known. */
export function gameJsonLd(game: GameSeo, url?: string, image?: string): Record<string, unknown> {
  const people = [game.author && { '@type': 'Person', name: game.author }, game.company && { '@type': 'Organization', name: game.company }].filter(Boolean);
  return strip({
    '@type': 'VideoGame',
    '@id': url ? `${url}#game` : undefined,
    name: game.title,
    description: gameDescription(game),
    url,
    image,
    author: people.length === 1 ? people[0] : people.length ? people : undefined,
    publisher: game.company ? { '@type': 'Organization', name: game.company } : undefined,
    datePublished: game.year ? String(game.year) : undefined,
    gamePlatform: ['Web browser', 'MS-DOS'],
    playMode: 'SinglePlayer',
    applicationCategory: 'Game',
    operatingSystem: 'Any (web browser)',
    isAccessibleForFree: true,
    creditText: `Made with ${PRODUCT}`,
    mentions: madeWith(),
  });
}

/** A JSON-LD <script> with the given nodes in one @graph. */
export function jsonLdScript(nodes: Record<string, unknown>[]): string {
  return `<script type="application/ld+json">${scriptJson({ '@context': 'https://schema.org', '@graph': nodes })}</script>`;
}

function strip(o: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
}
