// What the build gives search engines (scripts/seoBuild.ts): the sitemap, robots.txt, llms.txt,
// the home page's and the play pages' tags, JSON-LD and readable text. Every list and count of
// games leaves out the secret ones, and no page, file or picture name gives one away; downloads.html
// is the one exception (Lewis's choice): it lists them, with no play page and inlined pictures.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { IndexHtmlTransformContext } from 'vite';
import { cdCatalog, cdSecretCatalog } from '../../scripts/cdGames';
import { gamePageHtml, guidePageHtml, seoPages, staticPageHtml } from '../../scripts/seoBuild';
import { staticPages } from '../../scripts/seoStaticPages';
import { GUIDE_SECTIONS } from '../manual/guideSections';
import { gamePage, SITE_URL } from './site';
import { isStarterGame } from '../project/starter';

const cdRoot = join(__dirname, '../../../cd');
const catalog = cdCatalog(cdRoot);
const secret = cdSecretCatalog(cdRoot);
// a Special is out only on its days, so the build gives it no page (seoBuild.ts playable)
const playable = catalog.filter((g) => g.gam && g.series !== 'special');
const plugin = seoPages(cdRoot);

/** The files the build writes beside the pages (play.html is left out, so no game pages or pictures). */
function generatedFiles(): Record<string, string> {
  const out: Record<string, string> = {};
  const hook = plugin.generateBundle as { handler: (this: unknown, o: unknown, b: unknown) => void };
  hook.handler.call({ emitFile: (f: { fileName: string; source: string }) => (out[f.fileName] = String(f.source)) }, {}, {});
  return out;
}

const SHELL = '<!doctype html><html><head><title>x</title><!--SEO:HEAD--></head><body><!--SEO:BODY--></body></html>';

function page(name: string): string {
  const hook = plugin.transformIndexHtml as (html: string, ctx: IndexHtmlTransformContext) => string;
  return hook(SHELL, { filename: `/site/${name}`, path: `/${name}` });
}

/** The JSON-LD nodes in a page. */
function jsonLd(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => {
    const data = JSON.parse(m[1]) as { '@context': string; '@graph': Record<string, unknown>[] };
    expect(data['@context']).toBe('https://schema.org');
    return data['@graph'];
  });
}

/** Anything that would name or point at a secret game. */
function secretHits(text: string): string[] {
  return secret.flatMap((g) =>
    [g.title, gamePage(g.id), `og/${g.id}.png`, `"${g.id}"`, `game-${g.id}"`, g.path].filter((needle) => needle && text.includes(needle)),
  );
}

describe('seoBuild', () => {
  const files = generatedFiles();
  const home = page('index.html');
  const play = page('play.html');

  it('has secret games to keep out (or the checks below prove nothing)', () => {
    expect(secret.length).toBeGreaterThan(0);
    for (const g of secret) expect(catalog.some((c) => c.id === g.id)).toBe(false);
    for (const g of secret) expect(secretHits(`<a href="./${gamePage(g.id)}">${g.title}</a>`)).toHaveLength(2);
  });

  it('writes a sitemap of the home page, dos.html, downloads.html, web-player.html, each listed game’s page and each Guide section’s page', () => {
    const xml = files['sitemap.xml'];
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs[0]).toBe(SITE_URL);
    expect(locs).toContain(`${SITE_URL}dos.html`);
    expect(locs).toContain(`${SITE_URL}downloads.html`);
    expect(locs).toContain(`${SITE_URL}web-player.html`);
    const guide = locs.filter((l) => /\/help-[\w-]+\.html$/.test(l));
    expect(guide.sort()).toEqual(GUIDE_SECTIONS.map(([id]) => `${SITE_URL}help-${id}.html`).sort());
    expect(
      locs
        .slice(4)
        .filter((l) => !guide.includes(l) && !/\/(cast|library|magazine)\.html$/.test(l))
        .sort(),
    ).toEqual(playable.map((g) => `${SITE_URL}${gamePage(g.id)}`).sort());
    expect(new Set(locs).size).toBe(locs.length);
    for (const loc of locs) expect(loc.startsWith(SITE_URL)).toBe(true);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  });

  it('makes each Guide section a page of its own that opens it in the app', () => {
    const index = page('index.html');
    for (const section of GUIDE_SECTIONS) {
      const html = guidePageHtml(index, section);
      expect(html).toContain(`<link rel="canonical" href="${SITE_URL}help-${section[0]}.html" />`);
      expect(html).toContain(`#/help/${section[0]}`);
      expect(html).toMatch(/<title>[^<]+ · Guide · /);
      expect(html.match(/<h1>/g)).toHaveLength(1);
      expect(html).toMatch(/<meta name="description" content="[^"]{20,}"/);
    }
  });

  it('describes a Starter as a small teaching game, not a shareware release', () => {
    const starter = playable.find((g) => isStarterGame(g))!;
    const html = gamePageHtml(page('play.html'), starter);
    expect(html).toMatch(/name="description" content="[^"]*Starter game made with Game-Maker/);
    expect(html).not.toMatch(/name="description" content="[^"]*shareware/);
  });

  it('gives every play page one accurate VideoGame: no invented dates, ratings or reviews, and no secret game anywhere on it', () => {
    const shell = page('play.html');
    for (const g of playable) {
      const html = gamePageHtml(shell, g);
      const games = jsonLd(html).filter((n) => n['@type'] === 'VideoGame');
      expect(games, g.id).toHaveLength(1);
      const v = games[0];
      expect(v.name).toBe(g.title);
      expect(v.url).toBe(`${SITE_URL}${gamePage(g.id)}`);
      // a game made for this project (a Starter too) has an in-story year, not a publication date
      if (g.original) expect(v.datePublished, g.id).toBeUndefined();
      else if (g.year) expect(v.datePublished).toBe(String(g.year));
      for (const key of ['aggregateRating', 'review', 'offers', 'award']) expect(v[key], `${g.id} ${key}`).toBeUndefined();
      expect(secretHits(html), g.id).toEqual([]);
    }
  });

  it('keeps the generic player and the player to try out of search results, not the download', () => {
    expect(page('play.html')).toMatch(/<meta name="robots" content="noindex" \/>/);
    for (const g of playable.slice(0, 5)) expect(gamePageHtml(page('play.html'), g)).not.toContain('noindex');
  });

  it('gives the cast and the Library pages of their own, in the sitemap, linking only to listed games and naming no secret game', () => {
    const pages = staticPages(catalog);
    expect(pages.map((p) => p.file)).toEqual(['cast.html', 'magazine.html', 'library.html']);
    const index = page('index.html');
    const ids = new Set(playable.map((g) => g.id));
    for (const p of pages) {
      const html = staticPageHtml(index, p);
      expect(files['sitemap.xml']).toContain(`<loc>${SITE_URL}${p.file}</loc>`);
      expect(html).toContain(`<link rel="canonical" href="${SITE_URL}${p.file}" />`);
      expect(html).toMatch(/<meta name="description" content="[^"]{50,}"/);
      expect(html).toContain(`history.replaceState(null,'',"${p.hash}")`);
      expect(html.match(/<h1>/g)).toHaveLength(1);
      const plays = [...html.matchAll(/href="\.\/play-([^"]+)\.html"/g)].map((m) => m[1]);
      if (p.file !== 'magazine.html') expect(plays.length, p.file).toBeGreaterThan(5);
      for (const id of plays) expect(ids.has(id), `${p.file} links ${id}`).toBe(true);
      expect(secretHits(html), p.file).toEqual([]);
      // and no secret game's name in the plain words either
      for (const g of secret) expect(html.toLowerCase(), p.file).not.toContain(g.title.toLowerCase());
    }
  });

  it('writes the How do I…? questions as readable text, each Starter linked to its play page', () => {
    const section = GUIDE_SECTIONS.find(([id]) => id === 'how-do-i')!;
    const html = guidePageHtml(page('index.html'), section, catalog);
    expect(html).not.toContain('shows here once the page has loaded');
    const withQuestions = playable.filter((g) => isStarterGame(g) && (g.original?.manual as { howDoI?: unknown[] } | undefined)?.howDoI?.length);
    expect(withQuestions.length).toBeGreaterThan(0);
    for (const g of withQuestions) expect(html).toContain(`href="./${gamePage(g.id)}"`);
    expect(html).toContain('How do I make a wall my hero has to jump over?');
    expect(html.match(/<h1>/g)).toHaveLength(1);
  });

  it('lists every original game’s ZIP on downloads.html (not the Starters), the secret ones last with no play page', () => {
    const html = files['downloads.html'];
    const originals = playable.filter((g) => g.original && !isStarterGame(g));
    expect(originals.length).toBeGreaterThan(0);
    for (const g of [...originals, ...secret]) expect(html).toContain(`href="./${g.path}${g.pack}"`);
    for (const g of playable.filter((p) => isStarterGame(p))) expect(html).not.toContain(`game-${g.id}"`);
    for (const g of secret) {
      expect(html).not.toContain(gamePage(g.id));
      expect(html).not.toContain(`games/shots/${g.id}-`);
      expect(html.indexOf(`game-${g.id}"`)).toBeGreaterThan(Math.max(...originals.map((o) => html.indexOf(`game-${o.id}"`))));
    }
    expect(html).not.toMatch(/href="\.\/games\/(gameware|shareware)\//);
    expect(html.match(/<h1>/g)).toHaveLength(1);
    for (const img of html.match(/<img [^>]*>/g) ?? []) expect(img).toMatch(/ alt="[^"]+"[^>]* width="\d+" height="\d+"| width="\d+" height="\d+" alt="[^"]+"/);
  });

  it('points robots.txt at the sitemap', () => {
    expect(files['robots.txt']).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);
    expect(files['robots.txt']).toMatch(/^User-agent: \*\nAllow: \//);
  });

  it('never names or links a secret game in a generated file or page but downloads.html', () => {
    const { 'downloads.html': _downloads, ...others } = files;
    for (const [name, text] of Object.entries({ ...others, home, play })) expect(secretHits(text), name).toEqual([]);
    for (const g of playable) expect(secretHits(gamePageHtml(play, g)), g.id).toEqual([]);
  });

  it('counts and lists only the listed games in the home page’s structured data', () => {
    const list = jsonLd(home).find((n) => n['@type'] === 'ItemList') as { numberOfItems: number; itemListElement: { url: string }[] };
    expect(list.numberOfItems).toBe(playable.length);
    expect(list.itemListElement.map((i) => i.url).sort()).toEqual(playable.map((g) => `${SITE_URL}${gamePage(g.id)}`).sort());
  });

  it('gives the home page its tags, a canonical address and one h1', () => {
    expect(home).toContain(`<link rel="canonical" href="${SITE_URL}" />`);
    for (const tag of ['og:title', 'og:description', 'og:image', 'og:url']) expect(home).toContain(`property="${tag}"`);
    expect(home).toContain('name="twitter:card" content="summary_large_image"');
    expect(home.match(/<h1\b/g)).toHaveLength(1);
  });

  it('describes the site, the app and the magazine in the home page’s structured data, and links the pages at #/…', () => {
    const types = jsonLd(home).map((n) => [n['@type']].flat().join('/'));
    expect(types).toEqual(expect.arrayContaining(['WebSite', 'WebApplication/SoftwareApplication', 'Periodical', 'PublicationIssue', 'ItemList']));
    for (const href of ['./#/help', './#/magazine', './#/cast', './#/credits', './dos.html']) expect(home).toContain(`<a href="${href}">`);
  });

  it('gives every game page its own title, canonical address, picture with alt text, VideoGame data and one h1', () => {
    const titles = new Set<string>();
    for (const g of playable) {
      const html = gamePageHtml(play, g);
      const url = `${SITE_URL}${gamePage(g.id)}`;
      const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
      expect(titles.has(title), title).toBe(false);
      titles.add(title);
      expect(html).toContain(`<link rel="canonical" href="${url}" />`);
      expect(html).toContain(`<meta property="og:image" content="${SITE_URL}og/${g.id}.png" />`);
      expect(html).toMatch(/<meta property="og:image:alt" content="[^"]+" \/>/);
      expect(html.match(/<h1\b/g), g.id).toHaveLength(1);
      for (const img of html.match(/<img\b[^>]*>/g) ?? []) expect(img).toMatch(/\balt="[^"]+"/);
      const game = jsonLd(html).find((n) => n['@type'] === 'VideoGame');
      expect(game?.name).toBe(g.title);
      expect(game?.url).toBe(url);
    }
  });
});
