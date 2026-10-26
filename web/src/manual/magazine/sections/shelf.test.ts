// The Shareware Shelf's list (data/gameMakerArchive.json): it loads, names each game once, never
// lists our own games or the secret ones, and checks exactly the archive games on the Game-Maker CD.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cdCatalog, cdSecretCatalog } from '../../../../scripts/cdGames';
import ARCHIVE from '../data/gameMakerArchive.json';
import { magContext, magGames } from '../games';
import { shelfItems, SHAREWARE_SHELF } from './shelf';

const repo = join(__dirname, '../../../../..');
const catalog = cdCatalog(join(repo, 'cd'));
const secret = cdSecretCatalog(join(repo, 'cd'));
const ctx = magContext(magGames(catalog));
const key = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

describe('The Shareware Shelf', () => {
  it('loads the archive list, with where and when it came from', () => {
    expect(ARCHIVE.games.length).toBeGreaterThan(200);
    expect(ARCHIVE.source).toMatch(/Internet Archive/);
    expect(ARCHIVE.query).toMatch(/game-maker_/);
    expect(ARCHIVE.fetched).toMatch(/^\d{4}-\d\d-\d\d$/);
    for (const g of ARCHIVE.games) {
      expect(g.title.trim(), g.title).toBe(g.title);
      expect(g.title, g.title).not.toMatch(/[[\]]|^Game-Maker:/);
    }
  });

  it('names each game once', () => {
    const seen = ARCHIVE.games.map((g) => `${key(g.title)}|${g.by ?? ''}`);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('leaves out our own games and the secret ones', () => {
    expect(secret.length).toBeGreaterThan(0);
    const titles = new Set(ARCHIVE.games.map((g) => key(g.title)));
    const words = JSON.stringify(ARCHIVE).toLowerCase();
    for (const g of catalog.filter((c) => c.original)) expect(titles.has(key(g.title)), g.id).toBe(false);
    for (const s of secret) {
      expect(titles.has(key(s.title)), s.id).toBe(false);
      expect(words, s.id).not.toMatch(new RegExp(`\\b${s.id.toLowerCase()}\\b`));
    }
  });

  it('checks the games on the Game-Maker CD, and only those', async () => {
    const cdIds = new Set(catalog.filter((g) => !g.original).map((g) => g.id));
    const marked = ARCHIVE.games.filter((g) => g.cd);
    for (const g of marked) expect(cdIds.has(g.cd!), g.title).toBe(true);
    expect(new Set(marked.map((g) => g.cd)).size).toBe(marked.length);
    expect((await shelfItems(ctx)).filter((i) => i.mark).length).toBe(marked.length);
  });

  it('prints every title once over its pages', async () => {
    const pages = await SHAREWARE_SHELF.pages(ctx);
    const printed = pages.flatMap((pg) => pg.blocks.flatMap((b) => (b.t === 'shelf' ? b.items.map((i) => i.title) : [])));
    expect(printed).toEqual(ARCHIVE.games.map((g) => g.title));
  });
});
