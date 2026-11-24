// What the build gives search engines (scripts/seoBuild.ts): the sitemap, robots.txt, llms.txt,
// the home page's and the play pages' tags, JSON-LD and readable text. Every list and count of
// games leaves out the secret ones, and no page, file or picture name gives one away.
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createServer, type IndexHtmlTransformContext } from 'vite';
import { chromium } from 'playwright-core';
import { cdCatalog, cdGames, cdSecretCatalog } from '../../scripts/cdGames';
import { gamePageHtml, guidePageHtml, seoPages, staticPageHtml } from '../../scripts/seoBuild';
import { readingPages } from '../../scripts/seoReadings';
import { staticPages } from '../../scripts/seoStaticPages';
import { chapterById } from '../programmersGuide/chapterList';
import { GUIDE_SECTIONS } from '../manual/guideSections';
import { PRODUCT } from '../edition';
import { gamePage, ROUTES, SITE_URL } from './site';
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

function page(name: string): string {
  const hook = plugin.transformIndexHtml as (html: string, ctx: IndexHtmlTransformContext) => string;
  return hook(readFileSync(join(__dirname, '../..', name), 'utf8'), { filename: `/site/${name}`, path: `/${name}` });
}

/** The JSON-LD nodes in a page. */
function jsonLd(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => {
    const data = JSON.parse(m[1]) as { '@context': string; '@graph': Record<string, unknown>[] };
    expect(data['@context']).toBe('https://schema.org');
    return data['@graph'];
  });
}

/** The JSON-LD nodes from an already-parsed script's text content (null/missing is no nodes at all,
 * so a commented-out script correctly yields nothing instead of still matching the raw HTML). */
function graphFrom(scriptText: string | null): Record<string, unknown>[] {
  if (!scriptText) return [];
  const data = JSON.parse(scriptText) as { '@context': string; '@graph': Record<string, unknown>[] };
  expect(data['@context']).toBe('https://schema.org');
  return data['@graph'];
}

/** Anything that would name or point at a secret game. */
function secretHits(text: string): string[] {
  return secret.flatMap((g) =>
    [g.title, gamePage(g.id), `og/${g.id}.png`, `"${g.id}"`, `game-${g.id}"`, g.path].filter((needle) => needle && text.includes(needle)),
  );
}

function expectGameTitle(renderedTitle: string, gameTitle: string) {
  expect(renderedTitle, gameTitle).toBe(`${gameTitle} · play in your browser · ${PRODUCT}`);
}

describe('seoBuild', () => {
  const files = generatedFiles();
  const home = page('index.html');
  const play = page('play.html');

  it('gives every public page unique, bounded descriptions and complete, consistent metadata', () => {
    const pages = {
      'index.html': home,
      'dos.html': page('dos.html'),
      'play.html': play,
      'downloads.html': files['downloads.html'],
      ...Object.fromEntries(playable.map((g) => [gamePage(g.id), gamePageHtml(play, g)])),
      ...Object.fromEntries(GUIDE_SECTIONS.map((s) => [`help-${s[0]}.html`, guidePageHtml(home, s, catalog)])),
      ...Object.fromEntries([...staticPages(catalog), ...readingPages].map((p) => [p.file, staticPageHtml(home, p)])),
    };
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    const decode = (s: string) => s.replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n))).replace(/&amp;/g, '&');
    for (const [name, html] of Object.entries(pages)) {
      const meta = (key: string) => decode(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`).exec(html)?.[1] ?? '');
      const title = decode(/<title>([^<]+)<\/title>/.exec(html)?.[1] ?? '');
      const description = meta('description');
      const url = `${SITE_URL}${name === 'index.html' ? '' : name}`;
      expect(html, name).toContain('<html lang="en">');
      expect(html.match(/<h1\b/g), name).toHaveLength(1);
      expect(title.length, name).toBeGreaterThan(0);
      expect(titles.has(title), name).toBe(false);
      expect(descriptions.has(description), name).toBe(false);
      titles.add(title);
      descriptions.add(description);
      expect(description.length, name).toBeGreaterThanOrEqual(50);
      expect(description.length, name).toBeLessThanOrEqual(160);
      expect(html.match(/<link rel="canonical"/g), name).toHaveLength(1);
      expect(html, name).toContain(`rel="canonical" href="${url}"`);
      expect(meta('og:url'), name).toBe(url);
      for (const prefix of ['og', 'twitter']) {
        expect(meta(`${prefix}:title`), name).toBe(title);
        expect(meta(`${prefix}:description`), name).toBe(description);
        expect(meta(`${prefix}:image`), name).toMatch(/^https:\/\//);
        expect(meta(`${prefix}:image:alt`).length, name).toBeGreaterThan(0);
      }
      expect(meta('twitter:card'), name).toBe('summary_large_image');
      expect(secretHits(html), name).toEqual([]);
      if (name !== 'play.html') expect(files['sitemap.xml'], name).toContain(`<loc>${url}</loc>`);
    }
  });

  it('keeps each chapter description after the interactive Programmer’s Guide loads', async () => {
    const server = await createServer({
      configFile: false,
      plugins: [cdGames(cdRoot), plugin],
      server: { host: '127.0.0.1', port: 6155, hmr: false, watch: null },
      logLevel: 'error',
    });
    try {
      await server.listen();
      const browser = await chromium.launch();
      try {
        const page = await browser.newPage();
        const descriptions = [];
        for (const id of ['memory', 'screen']) {
          const chapter = chapterById(id)!;
          await page.goto(new URL(`programmers-guide-${id}.html`, server.resolvedUrls!.local[0]).href);
          await page.locator('.pg-page').getByRole('heading', { level: 1, name: chapter.title, exact: true }).waitFor();
          const description = await page.locator('meta[name="description"]').getAttribute('content');
          expect(description).toBe(chapter.about);
          descriptions.push(description);
        }
        expect(new Set(descriptions).size).toBe(2);
      } finally {
        await browser.close();
      }
    } finally {
      await server.close();
    }
  }, 60000);

  it('uses the magazine document’s canonical URL for the periodical and both issues', () => {
    const magazine = staticPages(catalog).find((p) => p.file === 'magazine.html')!;
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(staticPageHtml(home, magazine))?.[1];
    expect(canonical).toBe(new URL(magazine.file, SITE_URL).href);
    const nodes = jsonLd(home);
    expect(nodes.filter((n) => n['@type'] === 'Periodical').map((n) => n.url)).toEqual([canonical]);
    expect(nodes.filter((n) => n['@type'] === 'PublicationIssue').map((n) => n.url)).toEqual([canonical, canonical]);
  });

  it('follows the static Library’s TURBO BUTTON link to the magazine without scripts', async () => {
    const documents = new Map([[SITE_URL, home]]);
    for (const p of staticPages(catalog)) documents.set(new URL(p.file, SITE_URL).href, staticPageHtml(home, p));
    const libraryUrl = new URL('library.html', SITE_URL);
    // A real HTML parser, so a link inside a comment, a script or an attribute doesn't count.
    const browser = await chromium.launch();
    let hrefs: (string | null)[];
    try {
      const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
      await page.route('**/*', (route) => route.abort());
      await page.setContent(documents.get(libraryUrl.href)!, { waitUntil: 'domcontentloaded' });
      const links = page.locator('main').getByRole('link', { name: 'TURBO BUTTON', exact: true });
      hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    } finally {
      await browser.close();
    }
    expect(hrefs).toHaveLength(1);
    const destination = new URL(hrefs[0]!, libraryUrl);
    destination.hash = '';
    expect(destination.href).toBe(new URL('magazine.html', SITE_URL).href);
    expect(documents.get(destination.href)).toContain('<h1>TURBO BUTTON</h1>');
  }, 30000);

  it('links every reading from its contents and serves lesson figures and structured chapter text', () => {
    for (const [slug, count] of [
      ['art-courses', 7],
      ['programmers-guide', 19],
    ] as const) {
      const contents = readingPages.find((p) => p.file === slug + '.html')!;
      const readings = readingPages.filter((p) => p.hash.startsWith(contents.hash + '/'));
      expect(readings).toHaveLength(count);
      for (const p of readings) {
        expect(contents.html).toContain('href="./' + p.file + '"');
        expect(p.html).toContain('href="./' + contents.file + '"');
        expect(p.html).toContain(p.hash.endsWith('/limits') ? '<table>' : '<h2>');
        expect(p.html).toContain(slug === 'art-courses' ? '<figcaption>' : '<p>');
      }
    }
  });

  it('opens the next Guide chapter at its static address with and without JavaScript', async () => {
    const server = await createServer({
      configFile: false,
      plugins: [cdGames(cdRoot), plugin],
      server: { host: '127.0.0.1', port: 6155, hmr: false, watch: null },
      logLevel: 'error',
    });
    try {
      await server.listen();
      const browser = await chromium.launch();
      try {
        const page = await browser.newPage();
        const base = server.resolvedUrls!.local[0];
        const file = 'programmers-guide-screen.html';
        const title = 'The screen and the blocks';
        await page.goto(new URL('programmers-guide-memory.html', base).href);
        const next = page.getByRole('link', { name: `Next → ${title}` });
        const copied = await next.evaluate((a: HTMLAnchorElement) => a.href);
        await next.click();
        await page.locator('.pg-page').getByRole('heading', { name: title, exact: true }).waitFor();
        const address = new URL(page.url());
        address.hash = '';
        expect(address.href).toBe(new URL(file, base).href);
        expect(copied).toBe(address.href);
        expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(new URL(file, SITE_URL).href);

        const reader = await browser.newPage({ javaScriptEnabled: false });
        await reader.goto(page.url());
        expect(await reader.locator('h1').innerText()).toBe(title);
      } finally {
        await browser.close();
      }
    } finally {
      await server.close();
    }
  }, 60_000);

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
        .filter((l) => !guide.includes(l) && !readingPages.some((p) => l === SITE_URL + p.file) && !/\/(cast|library|magazine)\.html$/.test(l))
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

  it('describes First Steps as a Starter on both indexes and its play page', () => {
    const starter = playable.find((g) => g.id === 'first-steps')!;
    for (const index of [home, play]) {
      const sections = index.match(/<section>[\s\S]*?<\/section>/g) ?? [];
      const listings = sections.filter((section) => section.includes('id="game-first-steps"'));
      expect(listings).toHaveLength(1);
      expect(listings[0]).toContain('<h2>Starters</h2>');
      expect(listings[0]).not.toMatch(/shareware|registration/i);
    }
    const html = gamePageHtml(play, starter);
    expect(html).toContain('<p>A Starter game');
    expect(html).not.toMatch(/registration Free|Shareware: the author/i);
    expect(html).toMatch(/name="description" content="[^"]*Starter game made with Game-Maker/);
    expect(html).not.toMatch(/name="description" content="[^"]*shareware/);
  });

  it('omits the notice on the loaded First Steps screen and opens the author’s notice for AJ’s Quest', async () => {
    const server = await createServer({
      configFile: false,
      plugins: [cdGames(cdRoot), plugin],
      server: { host: '127.0.0.1', port: 6154, hmr: false, watch: null },
      logLevel: 'error',
    });
    try {
      await server.listen();
      const browser = await chromium.launch();
      try {
        const page = await browser.newPage();
        const base = server.resolvedUrls!.local[0];
        for (const id of ['first-steps', 'ajquest']) {
          const game = playable.find((g) => g.id === id)!;
          await page.goto(new URL(gamePage(id), base).href);
          const player = page.locator('#player');
          await player.getByRole('button', { name: `▶ Play ${game.title}` }).waitFor();
          const button = player.getByRole('button', { name: 'Shareware · read the author’s notice' });
          if (id === 'first-steps') {
            expect(await button.count()).toBe(0);
            expect(await player.locator('.gm-notice').count()).toBe(0);
          } else {
            expect(game.notice?.trim()).toBeTruthy();
            await button.click();
            const dialog = player.getByRole('dialog', { name: 'Shareware notice' });
            expect(await dialog.locator('pre').textContent()).toBe(game.notice);
          }
        }
      } finally {
        await browser.close();
      }
    } finally {
      await server.close();
    }
  }, 60000);

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

  it('lists only public original game ZIPs on downloads.html, with no Starters or secret games', () => {
    const html = files['downloads.html'];
    const originals = playable.filter((g) => g.original && !isStarterGame(g));
    expect(originals.length).toBeGreaterThan(0);
    for (const g of originals) expect(html).toContain(`href="./${g.path}${g.pack}"`);
    for (const g of playable.filter((p) => isStarterGame(p))) expect(html).not.toContain(`game-${g.id}"`);
    expect(secretHits(html)).toEqual([]);
    expect(html).not.toContain('Hidden games');
    expect(html).not.toMatch(/href="\.\/games\/(gameware|shareware)\//);
    expect(html.match(/<h1>/g)).toHaveLength(1);
    for (const img of html.match(/<img [^>]*>/g) ?? []) expect(img).toMatch(/ alt="[^"]+"[^>]* width="\d+" height="\d+"| width="\d+" height="\d+" alt="[^"]+"/);
  });

  it('points robots.txt at the sitemap', () => {
    expect(files['robots.txt']).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);
    expect(files['robots.txt']).toMatch(/^User-agent: \*\nAllow: \//);
  });

  it('never names or links a secret game in any generated file or page', () => {
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
    for (const href of ['./#/help', './magazine.html', './cast.html', './#/credits', './dos.html']) expect(home).toContain(`<a href="${href}">`);
  });

  it('rejects a wrong browser title when the expected title is in a comment', async () => {
    const game = playable[0];
    const html = gamePageHtml(play, game).replace(/<title>[^<]*<\/title>/, '<!--$&--><title>Wrong</title>');
    const browser = await chromium.launch();
    try {
      const reader = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
      await reader.route('**/*', (route) => route.abort());
      await reader.setContent(html, { waitUntil: 'domcontentloaded' });
      const title = await reader.title();
      expect(title).toBe('Wrong');
      expect(() => expectGameTitle(title, game.title)).toThrow();
    } finally {
      await browser.close();
    }
  });

  it('gives every game page its own title, canonical address, picture with alt text, VideoGame data and one h1', async () => {
    // A real HTML parser, so a tag inside a comment, a script or an attribute doesn't count.
    const browser = await chromium.launch();
    try {
      const reader = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
      await reader.route('**/*', (route) => route.abort());
      const titles = new Set<string>();
      for (const g of playable) {
        const html = gamePageHtml(play, g);
        const url = `${SITE_URL}${gamePage(g.id)}`;
        await reader.setContent(html, { waitUntil: 'domcontentloaded' });
        const parsed = await reader.evaluate((src) => {
          const attrs = (selector: string, name: string) => [...document.querySelectorAll(selector)].map((e) => e.getAttribute(name));
          return {
            title: document.title,
            ogTitle: attrs('head meta[property="og:title"]', 'content'),
            twitterTitle: attrs('head meta[name="twitter:title"]', 'content'),
            canonical: attrs('head link[rel="canonical"]', 'href'),
            ogImage: attrs('head meta[property="og:image"]', 'content'),
            ogImageAlt: attrs('head meta[property="og:image:alt"]', 'content'),
            twitterImageAlt: attrs('head meta[name="twitter:image:alt"]', 'content'),
            h1s: document.querySelectorAll('h1').length,
            alts: attrs('img', 'alt'),
            preview: [...document.querySelectorAll('main img')].filter((img) => img.getAttribute('src') === src).map((img) => img.getAttribute('alt')),
            // read from the parsed DOM, not the raw HTML text, so a commented-out script or title
            // element is really gone instead of still matching a raw-HTML regex (Q188)
            jsonLd: document.querySelector('script[type="application/ld+json"]')?.textContent ?? null,
          };
        }, `./og/${g.id}.png`);
        expectGameTitle(parsed.title, g.title);
        expect(parsed.ogTitle, g.id).toEqual([parsed.title]);
        expect(parsed.twitterTitle, g.id).toEqual([parsed.title]);
        expect(titles.has(parsed.title), parsed.title).toBe(false);
        titles.add(parsed.title);
        expect(parsed.canonical, g.id).toEqual([url]);
        expect(parsed.ogImage, g.id).toEqual([`${SITE_URL}og/${g.id}.png`]);
        const expectedAlt = `${g.title} — Play in your browser · ${PRODUCT}`;
        expect(parsed.ogImageAlt, g.id).toEqual([expectedAlt]);
        expect(parsed.twitterImageAlt, g.id).toEqual([expectedAlt]);
        expect(parsed.h1s, g.id).toBe(1);
        for (const alt of parsed.alts) expect(alt?.trim(), g.id).toBeTruthy();
        expect(parsed.preview, g.id).toEqual([expectedAlt]);
        expect(html).not.toContain('its title screen');
        if (g.series === 'starter') expect(html).toContain('<p>A Starter game that shows one Game-Maker idea');
        const game = graphFrom(parsed.jsonLd).find((n) => n['@type'] === 'VideoGame');
        expect(game?.name, g.id).toBe(g.title);
        expect(game?.url, g.id).toBe(url);
      }
    } finally {
      await browser.close();
    }
  }, 60_000);

  it('writes each route description whole (at most 160 characters before any clipping) in one voice', () => {
    for (const [name, route] of Object.entries(ROUTES)) {
      expect(route.description.length, name).toBeLessThanOrEqual(160);
      expect(route.description, name).not.toMatch(/\b(we|our|us)\b/i);
    }
  });
});
