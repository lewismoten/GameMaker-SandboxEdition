// The Library's list (#/library, libraryPage.ts) as plain data: what each thing is, whose it
// is, how it opens, and the two ways of sorting it (by game, or by the kind of paper). Built
// from the catalog by listing.ts; nothing here touches the page, so the tests can check it.
import { isSandboxGame, type CatalogEntry } from '../project/files';
import { isBizarreGame } from '../project/bizarre';
import { isOldSecret } from '../project/secretGames';
import type { PrintableItem } from '../manual/printables/types';

/** The kinds of paper, in the order "By type" shows them. */
export const SHELF_TYPES = [
  ['manual', 'Manuals'],
  ['hintbook', 'Hint books'],
  ['map', 'Maps'],
  ['poster', 'Posters'],
  ['newsletter', 'Newsletters and newspapers'],
  ['stickers', 'Sticker sheets'],
  ['keys', 'Keyboard reference cards'],
  ['registration', 'Registration cards'],
  ['idcard', 'Business and ID cards'],
  ['license', 'License and warranty cards'],
  ['letter', 'Letters and papers'],
  ['catalog', 'Catalogs and ads'],
  ['insert', 'Box inserts'],
  ['magazine', 'Magazines and zines'],
  ['guide', 'Guides'],
] as const;

export type ShelfType = (typeof SHELF_TYPES)[number][0];

/** How a thing opens: in its box's viewer at that piece, in the Game-Maker box, at a page of the site, or the zine. */
export type Opening =
  { via: 'box'; game: string; start: string; maps?: boolean } | { via: 'gm'; start: string } | { via: 'href'; href: string } | { via: 'zine' };

export interface ShelfItem {
  /** Unique on the shelf: its owner and its id in the box. */
  key: string;
  title: string;
  note?: string;
  icon: string;
  type: ShelfType;
  /** A game's id, GM_OWNER for the Game-Maker box, or SITE_OWNER for the site's own reading. */
  owner: string;
  ownerTitle: string;
  open: Opening;
}

export const GM_OWNER = 'gamemaker';
export const SITE_OWNER = 'site';

/** The Game-Maker box's pieces (manual/printables/gmItems.ts) by id. */
const GM_TYPES: Record<string, ShelfType> = {
  manual: 'manual',
  ultimate: 'manual',
  disks: 'insert',
  gmkeys: 'keys',
  template: 'keys',
  mapgrid: 'insert',
  regcard: 'registration',
  regconfirm: 'letter',
  license: 'license',
  support: 'idcard',
  catalog: 'catalog',
  bard: 'catalog',
  poster: 'poster',
  bbs: 'catalog',
  stickers: 'stickers',
};

/** What every game's box gets (manual/printables/items.ts), by id. */
const BOX_TYPES: Record<string, ShelfType> = {
  manual: 'manual',
  worldmap: 'map',
  levelmaps: 'map',
  keycard: 'keys',
  postcard: 'registration',
  warranty: 'license',
  newsletter: 'newsletter',
  catalog: 'catalog',
  bbs: 'catalog',
  hintoffer: 'registration',
  stickers: 'stickers',
};

/** A game's own piece (its printables.json), by its kind and, for a few kinds, its title. */
function ownType(kind: PrintableItem['kind'], title: string): ShelfType {
  switch (kind) {
    case 'hintbook':
      return 'hintbook';
    case 'map':
      return /poster/i.test(title) ? 'poster' : 'map';
    case 'starchart':
      return 'map';
    case 'chart':
      return /map|plan/i.test(title) ? 'map' : 'letter';
    case 'newspaper':
      return 'newsletter';
    case 'idcard':
      return 'idcard';
    case 'letter':
      return /postcard/i.test(title) ? 'registration' : 'letter';
    case 'journal':
    case 'recipe':
      return 'letter';
  }
}

/** A box piece's kind of paper: `own` is the printables.json item behind an `own<n>` piece. */
export function typeOfPiece(owner: string, id: string, own?: Pick<PrintableItem, 'kind' | 'title'>): ShelfType {
  if (own) return ownType(own.kind, own.title);
  return (owner === GM_OWNER ? GM_TYPES[id] : BOX_TYPES[id]) ?? 'letter';
}

/**
 * The games with paper to read: Sandbox Software's boxed games (with a manual) and the Bard
 * of Bizarre's (their maps), Sandbox's first, each by title. Never a secret game, even one
 * an older dev server lists or a reveal has added.
 */
export function shelfGames(entries: readonly CatalogEntry[]): { boxed: CatalogEntry[]; maps: CatalogEntry[] } {
  const listed = entries.filter((e) => !isOldSecret(e.id));
  const byTitle = (a: CatalogEntry, b: CatalogEntry) => a.title.localeCompare(b.title);
  return {
    boxed: listed.filter((e) => isSandboxGame(e) && !!e.original?.manual).sort(byTitle),
    maps: listed.filter((e) => isBizarreGame(e) && !e.original?.manual).sort(byTitle),
  };
}

/** The two ways to sort the shelf. */
export type ShelfOrder = 'game' | 'type';

export const isShelfOrder = (s: unknown): s is ShelfOrder => s === 'game' || s === 'type';

/** A heading on the shelf and what is under it (Other has two parts: the Game-Maker box and the rest). */
export interface ShelfGroup {
  key: string;
  heading: string;
  parts: { heading?: string; items: ShelfItem[] }[];
}

/**
 * The shelf sorted: by game (each game in the order listed, then Other: the Game-Maker box and
 * the site's own reading), or by type (SHELF_TYPES' order, each kind in the order listed).
 * Empty groups are left out.
 */
export function groupShelf(items: readonly ShelfItem[], order: ShelfOrder): ShelfGroup[] {
  if (order === 'type')
    return SHELF_TYPES.map(([type, heading]) => ({ key: `type-${type}`, heading, parts: [{ items: items.filter((i) => i.type === type) }] })).filter(
      (g) => g.parts[0].items.length,
    );
  const games: ShelfGroup[] = [];
  const byOwner = new Map<string, ShelfItem[]>();
  for (const it of items) {
    if (it.owner === GM_OWNER || it.owner === SITE_OWNER) continue;
    let list = byOwner.get(it.owner);
    if (!list) {
      byOwner.set(it.owner, (list = []));
      games.push({ key: `game-${it.owner}`, heading: it.ownerTitle, parts: [{ items: list }] });
    }
    list.push(it);
  }
  const site = items.filter((i) => i.owner === SITE_OWNER);
  const gm = items.filter((i) => i.owner === GM_OWNER);
  const other: ShelfGroup = {
    key: 'other',
    heading: 'Other',
    parts: [
      { heading: 'Magazines, guides and more', items: site },
      { heading: gm[0]?.ownerTitle ?? '', items: gm },
    ].filter((p) => p.items.length),
  };
  return other.parts.length ? [...games, other] : games;
}
