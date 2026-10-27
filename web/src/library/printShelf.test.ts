// The print shop's cards: a game's disk labels and retail box, only for the games the shelf
// lists (a secret game's only once revealed), and the two CD labels in their places.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import type { CatalogEntry } from '../project/files';
import { GM_OWNER, groupShelf, shelfGames, SITE_OWNER } from './shelf';
import { cdPrintItems, gamePrintItems } from './printShelf';

const GAMES = new URL('../../../games/', import.meta.url);

/** The games whose about.json says they are secret, read from their folders (named nowhere here). */
function secretIds(): string[] {
  return readdirSync(GAMES).filter((id) => {
    const about = new URL(`${id}/about.json`, GAMES);
    return existsSync(about) && (JSON.parse(readFileSync(about, 'utf8')) as { secret?: boolean }).secret === true;
  });
}

const boxed = (id: string): CatalogEntry => ({
  id,
  title: id,
  kind: 'shareware',
  path: '',
  gam: null,
  files: [],
  company: 'Sandbox Software',
  original: { manual: { title: id, pages: [] }, box: {} as NonNullable<NonNullable<CatalogEntry['original']>['box']> },
});

/** The print-shop cards for what the shelf lists, as listing.ts makes them. */
const cards = (entries: CatalogEntry[], unlocked?: Set<string>) => {
  const { boxed: b, maps } = shelfGames(entries, unlocked);
  return [...b, ...maps].flatMap(gamePrintItems);
};

describe('the print shop’s cards', () => {
  it('gives a boxed game its disk labels and retail box, a game with no box only its labels', () => {
    expect(gamePrintItems(boxed('teddy')).map((i) => [i.title, i.type])).toEqual([
      ['Disk labels', 'labels'],
      ['Retail box', 'retailbox'],
    ]);
    const bare = { ...boxed('carl'), original: {} };
    expect(gamePrintItems(bare).map((i) => i.title)).toEqual(['Disk labels']);
  });

  it('never has a secret game’s labels or box until it is revealed', () => {
    const secret = secretIds();
    expect(secret.length).toBeGreaterThan(0);
    const all = [...secret.map(boxed), boxed('teddy')];
    const hidden = cards(all);
    expect(hidden.map((i) => i.owner)).toEqual(['teddy', 'teddy']);
    const shown = cards(all, new Set(secret));
    for (const id of secret) expect(shown.filter((i) => i.owner === id).map((i) => i.title)).toEqual(['Disk labels', 'Retail box']);
  });

  it('puts the Game-Maker box flat and its CD with the Game-Maker box and TURBO BUTTON’s disc with the site’s reading', () => {
    const [box, gm, turbo] = cdPrintItems('The Game-Maker box');
    expect([box.owner, box.type]).toEqual([GM_OWNER, 'retailbox']);
    expect(gm.owner).toBe(GM_OWNER);
    expect(turbo.owner).toBe(SITE_OWNER);
    const other = groupShelf([...gamePrintItems(boxed('teddy')), box, gm, turbo], 'game').find((g) => g.key === 'other')!;
    expect(other.parts.map((p) => [p.heading, p.items.map((i) => i.title)])).toEqual([
      ['Magazines, guides and more', ['TURBO BUTTON CD label']],
      ['The Game-Maker box', ['Game-Maker retail box', 'Game-Maker CD label']],
    ]);
    const byType = groupShelf([...gamePrintItems(boxed('teddy')), box, gm, turbo], 'type').map((g) => [g.heading, g.parts[0].items.length]);
    expect(byType).toEqual([
      ['Disk and CD labels', 3],
      ['Retail boxes', 2],
    ]);
  });
});
