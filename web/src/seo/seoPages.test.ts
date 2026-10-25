// What the build gives search engines (scripts/seoBuild.ts): the sitemap, robots.txt, llms.txt,
// the home page's and the play pages' tags, JSON-LD and readable text. Every list and count of
// games leaves out the secret ones, and no page, file or picture name gives one away.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { IndexHtmlTransformContext } from 'vite';
import { cdCatalog, cdSecretCatalog } from '../../scripts/cdGames';
import { gamePageHtml, seoPages } from '../../scripts/seoBuild';
import { gamePage, SITE_URL } from './site';

const cdRoot = join(__dirname, '../../../cd');
const catalog = cdCatalog(cdRoot);
const secret = cdSecretCatalog(cdRoot);
const playable = catalog.filter((g) => g.gam);
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

  it('writes a sitemap of the home page, dos.html and each listed game’s page', () => {
    const xml = files['sitemap.xml'];
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs[0]).toBe(SITE_URL);
    expect(locs).toContain(`${SITE_URL}dos.html`);
    expect(locs.slice(2).sort()).toEqual(playable.map((g) => `${SITE_URL}${gamePage(g.id)}`).sort());
    expect(new Set(locs).size).toBe(locs.length);
    for (const loc of locs) expect(loc.startsWith(SITE_URL)).toBe(true);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  });

  it('points robots.txt at the sitemap', () => {
    expect(files['robots.txt']).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);
    expect(files['robots.txt']).toMatch(/^User-agent: \*\nAllow: \//);
  });

  it('never names or links a secret game in a generated file or page', () => {
    for (const [name, text] of Object.entries({ ...files, home, play })) expect(secretHits(text), name).toEqual([]);
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
