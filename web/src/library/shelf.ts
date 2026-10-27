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
  ['worldmap', 'World Maps'],
  ['levelmap', 'Level Maps'],
  ['map', 'Other maps and plans'],
  ['poster', 'Posters'],
  ['newsletter', 'Newsletters and newspapers'],
  ['stickers', 'Sticker sheets'],
  ['keys', 'Keyboard reference cards'],
  ['registration', 'Registration cards'],
  ['hintcard', 'Hint book postcards'],
  ['idcard', 'Business and ID cards'],
  ['license', 'License and warranty cards'],
  ['letter', 'Letters and papers'],
  ['catalog', 'Catalogs and ads'],
  ['insert', 'Box inserts'],
  ['magazine', 'Magazines and zines'],
  ['guide', 'Guides'],
  ['walkthrough', 'Walkthroughs'],
  ['video', 'Videos'],
] as const;

type ShelfType = (typeof SHELF_TYPES)[number][0];

/** How a thing opens: in its box's viewer at that piece, in the Game-Maker box, at a page of the site, the zine, a game's walkthrough player, or a video's player (videoDialog.ts, by its YouTube id). */
type Opening =
  | { via: 'box'; game: string; start: string; maps?: boolean }
  | { via: 'gm'; start: string }
  | { via: 'href'; href: string }
  | { via: 'zine' }
  | { via: 'walk'; game: string }
  | { via: 'video'; id: string };

export interface ShelfItem {
  /** Unique on the shelf: its owner and its id in the box. */
  key: string;
  title: string;
  note?: string;
  icon: string;
  type: ShelfType;
  /** A game's id, GM_OWNER for the Game-Maker box, SITE_OWNER for the site's own reading, or SHARED_OWNER for a piece in several boxes. */
  owner: string;
  ownerTitle: string;
  open: Opening;
  /** A piece the same in several boxes (shared.ts): how many boxes it is in. */
  boxes?: number;
  /** A numbered issue (a box's Sandbox Scoop): its number, for reading in order, and its line ("Vol. 1, No. 3 · March 1995"). */
  issue?: { no: number; line: string };
  /** A walkthrough or a video: how long it plays, in seconds. */
  seconds?: number;
  /** A picture for the card from the site's own files (a video's), in place of a drawn sheet. */
  picture?: string;
}

export const GM_OWNER = 'gamemaker';
export const SITE_OWNER = 'site';
export const SHARED_OWNER = 'shared';

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
  worldmap: 'worldmap',
  levelmaps: 'levelmap',
  keycard: 'keys',
  postcard: 'registration',
  warranty: 'license',
  newsletter: 'newsletter',
  catalog: 'catalog',
  bbs: 'catalog',
  hintoffer: 'hintcard',
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
      return /hint book postcard/i.test(title) ? 'hintcard' : /postcard/i.test(title) ? 'registration' : 'letter';
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
 * of Bizarre's (their maps), Sandbox's first, each by title. A secret game only when `unlocked`
 * names it (one revealed in this browser, listing.ts); never one an older dev server lists while
 * it is still hidden. An unlocked one with no manual gets its maps, as the Bard's games do.
 */
export function shelfGames(entries: readonly CatalogEntry[], unlocked: ReadonlySet<string> = new Set()): { boxed: CatalogEntry[]; maps: CatalogEntry[] } {
  const revealed = (e: CatalogEntry) => isOldSecret(e.id) && unlocked.has(e.id);
  const listed = entries.filter((e) => !isOldSecret(e.id) || revealed(e));
  const byTitle = (a: CatalogEntry, b: CatalogEntry) => a.title.localeCompare(b.title);
  return {
    boxed: listed.filter((e) => isSandboxGame(e) && !!e.original?.manual).sort(byTitle),
    maps: listed.filter((e) => (isBizarreGame(e) || (revealed(e) && !!e.original)) && !e.original?.manual).sort(byTitle),
  };
}

/** The two ways to sort the shelf. */
export type ShelfOrder = 'game' | 'type';

export const isShelfOrder = (s: unknown): s is ShelfOrder => s === 'game' || s === 'type';

/**
 * One kind's pieces in the order listed, except that the Game-Maker box's Owner's Guides lead the
 * manuals, numbered issues (each box's Sandbox Scoop) lead their kind in issue order, and
 * walkthroughs go shortest first.
 */
function ofType(items: readonly ShelfItem[], type: ShelfType): ShelfItem[] {
  const all = items.filter((i) => i.type === type);
  if (type === 'manual') return [...all.filter((i) => i.owner === GM_OWNER), ...all.filter((i) => i.owner !== GM_OWNER)];
  // numbered issues first, in the order they came out, then the rest as listed
  if (type === 'walkthrough') return all.sort((a, b) => (a.seconds ?? 0) - (b.seconds ?? 0)); // shortest first
  const issues = all.filter((i) => i.issue).sort((a, b) => a.issue!.no - b.issue!.no);
  return issues.length ? [...issues, ...all.filter((i) => !i.issue)] : all;
}

/** A heading on the shelf and what is under it (Other has two parts: the Game-Maker box and the rest). */
export interface ShelfGroup {
  key: string;
  heading: string;
  parts: { heading?: string; items: ShelfItem[] }[];
}

/**
 * The shelf sorted: by game (each game in the order listed, then Other: the pieces in every box,
 * the site's own reading, its videos and the Game-Maker box), or by type (SHELF_TYPES' order, each kind in the order listed, the
 * Game-Maker Owner's Guides first among the manuals).
 * Empty groups are left out.
 */
export function groupShelf(items: readonly ShelfItem[], order: ShelfOrder): ShelfGroup[] {
  if (order === 'type')
    return SHELF_TYPES.map(([type, heading]) => ({ key: `type-${type}`, heading, parts: [{ items: ofType(items, type) }] })).filter(
      (g) => g.parts[0].items.length,
    );
  const games: ShelfGroup[] = [];
  const byOwner = new Map<string, ShelfItem[]>();
  for (const it of items) {
    if (it.owner === GM_OWNER || it.owner === SITE_OWNER || it.owner === SHARED_OWNER) continue;
    let list = byOwner.get(it.owner);
    if (!list) {
      byOwner.set(it.owner, (list = []));
      games.push({ key: `game-${it.owner}`, heading: it.ownerTitle, parts: [{ items: list }] });
    }
    list.push(it);
  }
  const site = items.filter((i) => i.owner === SITE_OWNER && i.type !== 'video');
  const videos = items.filter((i) => i.owner === SITE_OWNER && i.type === 'video');
  const gm = items.filter((i) => i.owner === GM_OWNER);
  const shared = items.filter((i) => i.owner === SHARED_OWNER);
  const other: ShelfGroup = {
    key: 'other',
    heading: 'Other',
    parts: [
      { heading: 'In every box', items: shared },
      { heading: 'Magazines, guides and more', items: site },
      { heading: 'Videos', items: videos },
      { heading: gm[0]?.ownerTitle ?? '', items: gm },
    ].filter((p) => p.items.length),
  };
  return other.parts.length ? [...games, other] : games;
}

/** Whose pieces these are (a game, the Game-Maker box or the site), each once, in the order listed: a kind's game picker. */
export function ownersOf(items: readonly ShelfItem[]): { owner: string; title: string }[] {
  const seen = new Map<string, string>();
  for (const i of items) if (!seen.has(i.owner)) seen.set(i.owner, i.ownerTitle);
  return [...seen].map(([owner, title]) => ({ owner, title }));
}

/** A length the way a video shows it (32:41, 5:07), with hours only from an hour up (1:00:05). */
export function hms(seconds: number): string {
  const s = Math.round(seconds);
  const [h, m, sec] = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
  const two = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
}
