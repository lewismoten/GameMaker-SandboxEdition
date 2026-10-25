// The Library's list: what kind of paper each piece is, the two sorts, which games it lists
// (never a secret one), and the site's own reading.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import type { CatalogEntry } from '../project/files';
import { GM_OWNER, groupShelf, shelfGames, SHELF_TYPES, SITE_OWNER, typeOfPiece, type ShelfItem } from './shelf';
import { siteShelf } from './siteShelf';

const GAMES = new URL('../../../games/', import.meta.url);

/** The games whose about.json says they are secret, read from their folders (named nowhere here). */
function secretIds(): string[] {
  return readdirSync(GAMES).filter((id) => {
    const about = new URL(`${id}/about.json`, GAMES);
    return existsSync(about) && (JSON.parse(readFileSync(about, 'utf8')) as { secret?: boolean }).secret === true;
  });
}

const boxed = (id: string, title = id): CatalogEntry => ({
  id,
  title,
  kind: 'shareware',
  path: '',
  gam: null,
  files: [],
  company: 'Sandbox Software',
  original: { manual: { title, pages: [] } },
});
const bard = (id: string, title = id): CatalogEntry => ({
  id,
  title,
  kind: 'shareware',
  path: '',
  gam: null,
  files: [],
  company: 'The Bard of Bizarre',
  series: 'bizarre',
  original: {},
});

const item = (owner: string, id: string, type: ShelfItem['type'], ownerTitle = owner): ShelfItem => ({
  key: `${owner}:${id}`,
  title: id,
  icon: '📄',
  type,
  owner,
  ownerTitle,
  open: { via: 'href', href: '#/' },
});

describe('the Library’s kinds of paper', () => {
  it('sorts every piece of a game’s box', () => {
    expect(typeOfPiece('teddy', 'manual')).toBe('manual');
    expect(typeOfPiece('teddy', 'worldmap')).toBe('map');
    expect(typeOfPiece('teddy', 'levelmaps')).toBe('map');
    expect(typeOfPiece('teddy', 'newsletter')).toBe('newsletter');
    expect(typeOfPiece('teddy', 'stickers')).toBe('stickers');
    for (const id of ['keycard', 'postcard', 'warranty', 'hintoffer']) expect(typeOfPiece('teddy', id)).toBe('card');
    for (const id of ['catalog', 'bbs']) expect(typeOfPiece('teddy', id)).toBe('catalog');
  });

  it('sorts a game’s own pieces by kind, and posters and maps by name', () => {
    expect(typeOfPiece('x', 'own0', { kind: 'hintbook', title: 'Hint Book' })).toBe('hintbook');
    expect(typeOfPiece('x', 'own0', { kind: 'map', title: 'Wiring poster' })).toBe('poster');
    expect(typeOfPiece('x', 'own0', { kind: 'map', title: 'Floor plan' })).toBe('map');
    expect(typeOfPiece('x', 'own0', { kind: 'chart', title: 'Courier’s sector map' })).toBe('map');
    expect(typeOfPiece('x', 'own0', { kind: 'chart', title: 'Case file' })).toBe('letter');
    expect(typeOfPiece('x', 'own0', { kind: 'newspaper', title: 'The Courier' })).toBe('newsletter');
    expect(typeOfPiece('x', 'own0', { kind: 'idcard', title: 'A card' })).toBe('card');
    expect(typeOfPiece('x', 'own0', { kind: 'letter', title: 'Hint book postcard' })).toBe('card');
    expect(typeOfPiece('x', 'own0', { kind: 'letter', title: 'A note' })).toBe('letter');
  });

  it('sorts the Game-Maker box’s pieces', () => {
    expect(typeOfPiece(GM_OWNER, 'ultimate')).toBe('manual');
    expect(typeOfPiece(GM_OWNER, 'bard')).toBe('catalog');
    expect(typeOfPiece(GM_OWNER, 'poster')).toBe('poster');
    expect(typeOfPiece(GM_OWNER, 'mapgrid')).toBe('insert');
    expect(typeOfPiece(GM_OWNER, 'regconfirm')).toBe('letter');
  });
});

describe('the Library’s games', () => {
  it('lists boxed games and the Bard’s, each by title', () => {
    const { boxed: b, maps } = shelfGames([boxed('b', 'Beta'), bard('z', 'Zed'), boxed('a', 'Alpha'), bard('y', 'Why')]);
    expect(b.map((g) => g.id)).toEqual(['a', 'b']);
    expect(maps.map((g) => g.id)).toEqual(['y', 'z']);
  });

  it('never lists a secret game, even one a catalog names', () => {
    const secret = secretIds();
    expect(secret.length).toBeGreaterThan(0);
    const { boxed: b, maps } = shelfGames([...secret.map((id) => boxed(id)), ...secret.map((id) => bard(id)), boxed('teddy')]);
    const listed = [...b, ...maps].map((g) => g.id);
    expect(listed).toEqual(['teddy']);
  });

  it('reads the catalog the site serves, never the secret games’ list', () => {
    const dir = new URL('./', import.meta.url);
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))) {
      const src = readFileSync(new URL(f, dir), 'utf8');
      expect(src, f).not.toMatch(/extra\.json|loadCatalog|loadGameList|withSecretGames/);
    }
  });
});

describe('sorting the Library', () => {
  const items = [
    item('a', 'manual', 'manual', 'Alpha'),
    item(SITE_OWNER, 'magazine', 'magazine'),
    item('a', 'worldmap', 'map', 'Alpha'),
    item(GM_OWNER, 'manual', 'manual', 'The Game-Maker box'),
    item('b', 'manual', 'manual', 'Beta'),
  ];

  it('by game: each game in the order listed, then Other with the site’s reading and the Game-Maker box', () => {
    const groups = groupShelf(items, 'game');
    expect(groups.map((g) => g.heading)).toEqual(['Alpha', 'Beta', 'Other']);
    expect(groups[0].parts[0].items.map((i) => i.key)).toEqual(['a:manual', 'a:worldmap']);
    expect(groups[2].parts.map((p) => [p.heading, p.items.map((i) => i.key)])).toEqual([
      ['Magazines, guides and more', [`${SITE_OWNER}:magazine`]],
      ['The Game-Maker box', [`${GM_OWNER}:manual`]],
    ]);
  });

  it('by type: in the kinds’ order, with no empty kinds', () => {
    const groups = groupShelf(items, 'type');
    expect(groups.map((g) => g.heading)).toEqual(['Manuals', 'Maps', 'Magazines and zines']);
    expect(groups[0].parts[0].items.map((i) => i.key)).toEqual(['a:manual', `${GM_OWNER}:manual`, 'b:manual']);
    expect(new Set(SHELF_TYPES.map(([t]) => t)).size).toBe(SHELF_TYPES.length);
  });

  it('keeps every piece, once, either way', () => {
    for (const order of ['game', 'type'] as const) {
      const keys = groupShelf(items, order).flatMap((g) => g.parts.flatMap((p) => p.items.map((i) => i.key)));
      expect(keys.sort()).toEqual(items.map((i) => i.key).sort());
    }
  });
});

describe('the site’s own reading', () => {
  it('has TURBO BUTTON and the Guide, and the desk’s zine only once it is found', () => {
    const hidden = siteShelf(false).map((i) => i.open);
    expect(hidden).toContainEqual({ via: 'href', href: '#/magazine' });
    expect(hidden).toContainEqual({ via: 'href', href: '#/help' });
    expect(hidden).not.toContainEqual({ via: 'zine' });
    expect(siteShelf(true).map((i) => i.open)).toContainEqual({ via: 'zine' });
  });
});
